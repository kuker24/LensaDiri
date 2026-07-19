import "server-only";

import crypto from "node:crypto";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword, verifyDummyPassword, verifyPassword } from "@/lib/auth/password";
import { SESSION_DURATION_MS } from "@/lib/auth/session";
import { hashOpaqueToken, generateOpaqueToken } from "@/lib/security/tokens";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { apiFailure } from "@/server/http";
import { createAuditLog } from "@/server/repositories/audit-logs";
import {
  createAccountWithAudit,
  findAccountByIdForAuthentication,
  findAccountForAuthentication,
  hardDeleteAccountBySessionHash,
  type AccountAuthenticationRecord,
} from "@/server/repositories/accounts";
import {
  createAccountSession,
  findAndTouchActiveSession,
  findSessionByTokenHash,
  revokeAccountSession,
  type ActiveSessionRecord,
} from "@/server/repositories/sessions";
import { consumeRateLimit, authRateLimitPolicies } from "@/server/services/rate-limiter";

export type ClientFingerprint = {
  ip: string;
  userAgent: string;
};

export type CreatedSession = {
  expiresAt: Date;
  token: string;
};

export type DeleteAccountResult = "deleted" | "invalid_credentials" | "invalid_session";

export type LoginAccountResult =
  | { success: true; data: CreatedSession }
  | { success: false; error: { code: "rate_limited"; retryAfterSeconds: number } }
  | { success: false; error: { code: "invalid_credentials" } };

function hashFingerprint(value: string, authSessionSecret: string): string | null {
  return value ? hashOpaqueToken(value, authSessionSecret) : null;
}

function toSessionHash(token: string, tokenHashPepper: string): string {
  return hashOpaqueToken(token, tokenHashPepper);
}

async function issueSession(
  accountId: string,
  fingerprint: ClientFingerprint,
  secrets: { authSessionSecret: string; tokenHashPepper: string },
  now = new Date(),
): Promise<CreatedSession> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await createAccountSession({
    accountId,
    expiresAt,
    ipHash: hashFingerprint(fingerprint.ip, secrets.authSessionSecret),
    sessionTokenHash: toSessionHash(token, secrets.tokenHashPepper),
    userAgentHash: hashFingerprint(fingerprint.userAgent, secrets.authSessionSecret),
  });

  return { expiresAt, token };
}

export async function registerAccount(
  input: {
    email: string;
    password: string;
  },
  correlationId = crypto.randomUUID(),
): Promise<{ created: boolean }> {
  const emailNormalized = normalizeEmail(input.email);

  const startHash = process.hrtime.bigint();
  let passwordHash: string;
  try {
    passwordHash = await hashPassword(input.password);
  } catch (error) {
    const endHash = process.hrtime.bigint();
    console.warn(
      `[TELEMETRY] cid=${correlationId} op=register_password_hash duration_ms=${(Number(endHash - startHash) / 1_000_000).toFixed(2)} status=error`,
    );
    throw error;
  }
  const endHash = process.hrtime.bigint();
  console.info(
    `[TELEMETRY] cid=${correlationId} op=register_password_hash duration_ms=${(Number(endHash - startHash) / 1_000_000).toFixed(2)} status=success`,
  );

  try {
    await createAccountWithAudit({
      auditMetadata: { outcome: "created" },
      correlationId,
      email: emailNormalized,
      emailNormalized,
      passwordHash,
    });
    return { created: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      error.kind === "conflict"
    ) {
      console.info(`[TELEMETRY] cid=${correlationId} op=register_account_insert status=conflict`);
      return { created: false };
    }
    throw error;
  }
}

export async function loginAccount(input: {
  email: string;
  fingerprint: ClientFingerprint;
  password: string;
  secrets: { authSessionSecret: string; tokenHashPepper: string; rateLimitSecret: string };
  correlationId?: string;
}): Promise<LoginAccountResult> {
  const correlationId = input.correlationId ?? crypto.randomUUID();
  const startRateLimit = process.hrtime.bigint();
  const rateLimitResult = await consumeRateLimit(
    `${input.fingerprint.ip}:${normalizeEmail(input.email)}`,
    authRateLimitPolicies.login,
    input.secrets.rateLimitSecret,
  );
  const endRateLimit = process.hrtime.bigint();
  console.info(
    `[TELEMETRY] cid=${correlationId} op=login_rate_limit duration_ms=${(Number(endRateLimit - startRateLimit) / 1_000_000).toFixed(2)} status=${rateLimitResult.allowed ? "success" : "rate_limited"}`,
  );
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: { code: "rate_limited", retryAfterSeconds: rateLimitResult.retryAfterSeconds },
    };
  }

  const startAccountRead = process.hrtime.bigint();
  const emailNormalized = normalizeEmail(input.email);
  const account = await findAccountForAuthentication(emailNormalized);
  const endAccountRead = process.hrtime.bigint();
  console.info(
    `[TELEMETRY] cid=${correlationId} op=login_account_read duration_ms=${(Number(endAccountRead - startAccountRead) / 1_000_000).toFixed(2)} status=${account ? "found" : "not_found"}`,
  );

  const startPasswordVerify = process.hrtime.bigint();
  const passwordMatches = account
    ? await verifyPassword(account.passwordHash, input.password)
    : await verifyDummyPassword(input.password).then(() => false);
  const endPasswordVerify = process.hrtime.bigint();
  console.info(
    `[TELEMETRY] cid=${correlationId} op=login_password_verify duration_ms=${(Number(endPasswordVerify - startPasswordVerify) / 1_000_000).toFixed(2)} status=${passwordMatches ? "match" : "mismatch"}`,
  );

  if (!account || !passwordMatches || account.status !== "active") {
    await createAuditLog({
      action: "account_login_failed",
      actorAccountId: null,
      entityId: null,
      entityType: "system",
      metadata: { reason: "invalid_credentials" },
    });
    return {
      success: false,
      error: { code: "invalid_credentials" },
    };
  }

  const startSessionWrite = process.hrtime.bigint();
  const session = await issueSession(account.id, input.fingerprint, input.secrets);
  const endSessionWrite = process.hrtime.bigint();
  console.info(
    `[TELEMETRY] cid=${correlationId} op=login_session_write duration_ms=${(Number(endSessionWrite - startSessionWrite) / 1_000_000).toFixed(2)} status=success`,
  );

  const startAuditWrite = process.hrtime.bigint();
  await createAuditLog({
    action: "account_login_succeeded",
    actorAccountId: account.id,
    entityId: account.id,
    entityType: "account",
    metadata: { outcome: "authenticated" },
  });
  const endAuditWrite = process.hrtime.bigint();
  console.info(
    `[TELEMETRY] cid=${correlationId} op=login_audit_write duration_ms=${(Number(endAuditWrite - startAuditWrite) / 1_000_000).toFixed(2)} status=success`,
  );

  return {
    success: true,
    data: session,
  };
}

export async function getActiveSession(
  token: string,
  tokenHashPepper: string,
  now = new Date(),
  correlationId?: string,
): Promise<ActiveSessionRecord | null> {
  return findAndTouchActiveSession(toSessionHash(token, tokenHashPepper), now, correlationId);
}

export async function logoutAccount(
  token: string | undefined,
  tokenHashPepper: string,
): Promise<void> {
  if (!token) {
    return;
  }

  const sessionHash = toSessionHash(token, tokenHashPepper);
  const session = await findSessionByTokenHash(sessionHash);
  const revoked = await revokeAccountSession(sessionHash);
  if (revoked && session) {
    await createAuditLog({
      action: "account_logout",
      actorAccountId: session.accountId,
      entityId: session.sessionId,
      entityType: "account_session",
      metadata: { outcome: "revoked" },
    });
  }
}

export async function deleteAccount(input: {
  password: string;
  sessionToken: string;
  tokenHashPepper: string;
}): Promise<DeleteAccountResult> {
  const sessionHash = toSessionHash(input.sessionToken, input.tokenHashPepper);
  const session = await findSessionByTokenHash(sessionHash);
  if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
    await verifyDummyPassword(input.password);
    return "invalid_session";
  }

  const account = await findAccountByIdForAuthentication(session.accountId);
  if (
    !account ||
    account.status !== "active" ||
    !(await verifyPassword(account.passwordHash, input.password))
  ) {
    return "invalid_credentials";
  }

  return (await hardDeleteAccountBySessionHash(sessionHash)) ? "deleted" : "invalid_session";
}

export function isActiveAccount(account: AccountAuthenticationRecord | null): boolean {
  return account?.status === "active";
}

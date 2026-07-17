import "server-only";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword, verifyDummyPassword, verifyPassword } from "@/lib/auth/password";
import { SESSION_DURATION_MS } from "@/lib/auth/session";
import { hashOpaqueToken, generateOpaqueToken } from "@/lib/security/tokens";
import { createAuditLog } from "@/server/repositories/audit-logs";
import {
  createAccount,
  findAccountByIdForAuthentication,
  findAccountForAuthentication,
  hardDeleteAccountBySessionHash,
  type AccountAuthenticationRecord,
} from "@/server/repositories/accounts";
import {
  createAccountSession,
  findSessionByTokenHash,
  revokeAccountSession,
  touchAccountSession,
  type ActiveSessionRecord,
} from "@/server/repositories/sessions";

export type ClientFingerprint = {
  ip: string;
  userAgent: string;
};

export type CreatedSession = {
  expiresAt: Date;
  token: string;
};

export type DeleteAccountResult = "deleted" | "invalid_credentials" | "invalid_session";

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

export async function registerAccount(input: {
  email: string;
  password: string;
}): Promise<{ created: boolean }> {
  const emailNormalized = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);

  try {
    const account = await createAccount({
      email: emailNormalized,
      emailNormalized,
      passwordHash,
    });
    await createAuditLog({
      action: "account_registered",
      actorAccountId: account.id,
      entityId: account.id,
      entityType: "account",
      metadata: { outcome: "created" },
    });
    return { created: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "kind" in error &&
      error.kind === "conflict"
    ) {
      return { created: false };
    }
    throw error;
  }
}

export async function loginAccount(input: {
  email: string;
  fingerprint: ClientFingerprint;
  password: string;
  secrets: { authSessionSecret: string; tokenHashPepper: string };
}): Promise<CreatedSession | null> {
  const emailNormalized = normalizeEmail(input.email);
  const account = await findAccountForAuthentication(emailNormalized);
  const passwordMatches = account
    ? await verifyPassword(account.passwordHash, input.password)
    : await verifyDummyPassword(input.password).then(() => false);

  if (!account || !passwordMatches || account.status !== "active") {
    await createAuditLog({
      action: "account_login_failed",
      actorAccountId: null,
      entityId: null,
      entityType: "system",
      metadata: { reason: "invalid_credentials" },
    });
    return null;
  }

  const session = await issueSession(account.id, input.fingerprint, input.secrets);
  await createAuditLog({
    action: "account_login_succeeded",
    actorAccountId: account.id,
    entityId: account.id,
    entityType: "account",
    metadata: { outcome: "authenticated" },
  });
  return session;
}

export async function getActiveSession(
  token: string,
  tokenHashPepper: string,
  now = new Date(),
): Promise<ActiveSessionRecord | null> {
  const session = await findSessionByTokenHash(toSessionHash(token, tokenHashPepper));
  if (
    !session ||
    session.accountStatus !== "active" ||
    session.revokedAt !== null ||
    session.expiresAt <= now
  ) {
    return null;
  }

  await touchAccountSession(toSessionHash(token, tokenHashPepper), now);
  return session;
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

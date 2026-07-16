import "server-only";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword } from "@/lib/auth/password";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { getRecoveryEmailTransport } from "@/server/email-transport";
import {
  discardUndeliveredRecoveryToken,
  findActiveRecoveryAccountByEmail,
  issueRecoveryToken,
  markRecoveryTokenDelivered,
  resetPasswordWithTokenHash,
  verifyEmailWithTokenHash,
  type RecoveryPurpose,
} from "@/server/repositories/account-recovery";
import { createAuditLog } from "@/server/repositories/audit-logs";

const RECOVERY_TOKEN_DURATION_MS = 30 * 60 * 1_000;

export type RecoveryConsumeResult = "completed" | "invalid_token";

async function requestRecovery(
  email: string,
  purpose: RecoveryPurpose,
  tokenHashPepper: string,
  now = new Date(),
): Promise<void> {
  const account = await findActiveRecoveryAccountByEmail(normalizeEmail(email));
  const action =
    purpose === "email_verification"
      ? ("email_verification_requested" as const)
      : ("password_reset_requested" as const);
  if (!account || (purpose === "email_verification" && account.verified)) {
    await createAuditLog({
      action,
      actorAccountId: null,
      entityId: null,
      entityType: "system",
      metadata: { outcome: "accepted" },
    });
    return;
  }
  const transport = getRecoveryEmailTransport();
  if (!transport.enabled) {
    await createAuditLog({
      action,
      actorAccountId: account.id,
      entityId: account.id,
      entityType: "account",
      metadata: { outcome: "delivery_disabled" },
    });
    return;
  }
  const token = generateOpaqueToken();
  const tokenId = await issueRecoveryToken({
    accountId: account.id,
    expiresAt: new Date(now.getTime() + RECOVERY_TOKEN_DURATION_MS),
    purpose,
    tokenHash: hashOpaqueToken(token, tokenHashPepper),
  });
  try {
    await transport.send({ email: account.email, purpose, token });
    await markRecoveryTokenDelivered({ accountId: account.id, purpose, tokenId });
  } catch (error) {
    await discardUndeliveredRecoveryToken(tokenId);
    await createAuditLog({
      action,
      actorAccountId: account.id,
      entityId: account.id,
      entityType: "account",
      metadata: { outcome: "delivery_failed" },
    });
    throw error;
  }
  await createAuditLog({
    action,
    actorAccountId: account.id,
    entityId: account.id,
    entityType: "account",
    metadata: { outcome: "issued" },
  });
}

export async function requestEmailVerification(
  email: string,
  tokenHashPepper: string,
): Promise<void> {
  await requestRecovery(email, "email_verification", tokenHashPepper);
}

export async function requestPasswordReset(email: string, tokenHashPepper: string): Promise<void> {
  await requestRecovery(email, "password_reset", tokenHashPepper);
}

export async function verifyEmailToken(
  token: string,
  tokenHashPepper: string,
): Promise<RecoveryConsumeResult> {
  const accountId = await verifyEmailWithTokenHash(hashOpaqueToken(token, tokenHashPepper));
  if (!accountId) return "invalid_token";
  await createAuditLog({
    action: "email_verified",
    actorAccountId: accountId,
    entityId: accountId,
    entityType: "account",
    metadata: { outcome: "completed" },
  });
  return "completed";
}

export async function resetPasswordWithToken(input: {
  password: string;
  token: string;
  tokenHashPepper: string;
}): Promise<RecoveryConsumeResult> {
  const passwordHash = await hashPassword(input.password);
  const accountId = await resetPasswordWithTokenHash({
    passwordHash,
    tokenHash: hashOpaqueToken(input.token, input.tokenHashPepper),
  });
  await createAuditLog({
    action: accountId ? "password_reset_completed" : "password_reset_failed",
    actorAccountId: accountId,
    entityId: accountId,
    entityType: accountId ? "account" : "system",
    metadata: { outcome: accountId ? "completed" : "invalid_token" },
  });
  return accountId ? "completed" : "invalid_token";
}

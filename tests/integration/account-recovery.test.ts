import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { clearTestRecoveryDeliveries, readTestRecoveryDelivery } from "@/server/email-transport";
import { createAccount, findAccountForAuthentication } from "@/server/repositories/accounts";
import { createAccountSession, findSessionByTokenHash } from "@/server/repositories/sessions";
import {
  requestEmailVerification,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmailToken,
} from "@/server/services/account-recovery";

const pepper = process.env.TOKEN_HASH_PEPPER!;

beforeAll(() => {
  process.env.RECOVERY_TEST_TRANSPORT = "1";
});

afterAll(async () => {
  clearTestRecoveryDeliveries();
  delete process.env.RECOVERY_TEST_TRANSPORT;
  await closeDatabaseForTests();
});

async function createRecoveryAccount(prefix: string) {
  const email = `${prefix}-${randomUUID()}@example.test`;
  const password = "original password 123";
  const account = await createAccount({
    email,
    emailNormalized: email,
    passwordHash: await hashPassword(password),
  });
  return { account, email, password };
}

describe("account recovery PostgreSQL lifecycle", () => {
  it("keeps unknown email requests generic and issues no token", async () => {
    const email = `missing-${randomUUID()}@example.test`;
    await expect(requestPasswordReset(email, pepper)).resolves.toBeUndefined();
    await expect(requestEmailVerification(email, pepper)).resolves.toBeUndefined();
    expect(readTestRecoveryDelivery(email, "password_reset")).toBeNull();
    expect(readTestRecoveryDelivery(email, "email_verification")).toBeNull();
  });

  it("verifies email once and rejects replay or expiry", async () => {
    const sql = getDatabase();
    const { account, email } = await createRecoveryAccount("verify");
    await requestEmailVerification(email, pepper);
    const delivery = readTestRecoveryDelivery(email, "email_verification");
    expect(delivery?.token).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    const [issued] = await sql<{ consumed_at: Date | null; delivered_at: Date | null }[]>`
      select delivered_at, consumed_at
      from public.account_recovery_tokens
      where token_hash = ${hashOpaqueToken(delivery!.token, pepper)}
    `;
    expect(issued?.delivered_at).toBeInstanceOf(Date);
    expect(issued?.consumed_at).toBeNull();
    await expect(verifyEmailToken(delivery!.token, pepper)).resolves.toBe("completed");
    await expect(verifyEmailToken(delivery!.token, pepper)).resolves.toBe("invalid_token");
    const [verified] = await sql<{ email_verified_at: Date | null }[]>`
      select email_verified_at from public.accounts where id = ${account.id}
    `;
    expect(verified?.email_verified_at).toBeInstanceOf(Date);

    const expired = await createRecoveryAccount("verify-expired");
    await requestEmailVerification(expired.email, pepper);
    const expiredDelivery = readTestRecoveryDelivery(expired.email, "email_verification")!;
    await sql`
      update public.account_recovery_tokens
      set expires_at = created_at + interval '1 millisecond'
      where token_hash = ${hashOpaqueToken(expiredDelivery.token, pepper)}
    `;
    await expect(verifyEmailToken(expiredDelivery.token, pepper)).resolves.toBe("invalid_token");
  });

  it("invalidates the previous delivered token when a replacement is delivered", async () => {
    const { email } = await createRecoveryAccount("replacement");
    await requestPasswordReset(email, pepper);
    const first = readTestRecoveryDelivery(email, "password_reset")!;
    await requestPasswordReset(email, pepper);
    const second = readTestRecoveryDelivery(email, "password_reset")!;

    expect(second.token).not.toBe(first.token);
    await expect(
      resetPasswordWithToken({
        password: "first token must fail 123",
        token: first.token,
        tokenHashPepper: pepper,
      }),
    ).resolves.toBe("invalid_token");
    await expect(
      resetPasswordWithToken({
        password: "second token succeeds 456",
        token: second.token,
        tokenHashPepper: pepper,
      }),
    ).resolves.toBe("completed");
  });

  it("allows only one concurrent consume of a delivered token", async () => {
    const { email } = await createRecoveryAccount("concurrent");
    await requestEmailVerification(email, pepper);
    const delivery = readTestRecoveryDelivery(email, "email_verification")!;
    const results = await Promise.all([
      verifyEmailToken(delivery.token, pepper),
      verifyEmailToken(delivery.token, pepper),
    ]);
    expect(results.sort()).toEqual(["completed", "invalid_token"]);
  });

  it("resets password once, revokes all sessions, and rejects expired or replayed tokens", async () => {
    const sql = getDatabase();
    const { account, email, password } = await createRecoveryAccount("reset");
    const sessionHashes = [0, 1].map((index) =>
      hashOpaqueToken(`recovery-session-${index}-${randomUUID()}`, pepper),
    );
    for (const sessionTokenHash of sessionHashes) {
      await createAccountSession({
        accountId: account.id,
        expiresAt: new Date(Date.now() + 60_000),
        ipHash: null,
        sessionTokenHash,
        userAgentHash: null,
      });
    }
    await requestPasswordReset(email, pepper);
    const delivery = readTestRecoveryDelivery(email, "password_reset")!;
    const newPassword = "replacement password 456";
    await expect(
      resetPasswordWithToken({
        password: newPassword,
        token: delivery.token,
        tokenHashPepper: pepper,
      }),
    ).resolves.toBe("completed");
    await expect(
      resetPasswordWithToken({
        password: "another password 789",
        token: delivery.token,
        tokenHashPepper: pepper,
      }),
    ).resolves.toBe("invalid_token");
    const stored = await findAccountForAuthentication(email);
    expect(await verifyPassword(stored!.passwordHash, password)).toBe(false);
    expect(await verifyPassword(stored!.passwordHash, newPassword)).toBe(true);
    for (const sessionHash of sessionHashes) {
      await expect(findSessionByTokenHash(sessionHash)).resolves.toMatchObject({
        revokedAt: expect.any(Date),
      });
    }

    const expired = await createRecoveryAccount("reset-expired");
    await requestPasswordReset(expired.email, pepper);
    const expiredDelivery = readTestRecoveryDelivery(expired.email, "password_reset")!;
    await sql`
      update public.account_recovery_tokens
      set expires_at = created_at + interval '1 millisecond'
      where token_hash = ${hashOpaqueToken(expiredDelivery.token, pepper)}
    `;
    await expect(
      resetPasswordWithToken({
        password: "expired replacement 123",
        token: expiredDelivery.token,
        tokenHashPepper: pepper,
      }),
    ).resolves.toBe("invalid_token");
  }, 120_000);
});

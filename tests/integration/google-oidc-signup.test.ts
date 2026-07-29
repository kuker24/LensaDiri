import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { findActiveRecoveryAccountByEmail } from "@/server/repositories/account-recovery";
import { resolveGoogleOidcAccount } from "@/server/repositories/oidc-identities";
import { loginAccount, registerAccount } from "@/server/services/auth";

afterAll(async () => {
  await closeDatabaseForTests();
});

describe("Google OIDC signup", () => {
  it("creates one passwordless account and reuses its provider identity", async () => {
    const suffix = randomUUID();
    const email = `google-${suffix}@example.com`;
    const identity = { email, issuer: "https://accounts.google.com", subject: suffix };

    await expect(resolveGoogleOidcAccount(identity)).resolves.toMatchObject({ outcome: "created" });
    const existing = await resolveGoogleOidcAccount(identity);
    expect(existing).toMatchObject({ outcome: "existing" });

    const sql = getDatabase();
    const accounts = await sql<{ email_verified_at: Date | null; password_hash: string | null }[]>`
      select password_hash, email_verified_at from public.accounts where email_normalized = ${email}
    `;
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ password_hash: null });
    expect(accounts[0]?.email_verified_at).toBeInstanceOf(Date);
    await expect(findActiveRecoveryAccountByEmail(email)).resolves.toBeNull();
    await expect(
      loginAccount({
        email,
        fingerprint: { ip: `google-login-${suffix}`, userAgent: "integration-test" },
        password: "not-a-provider-password",
        secrets: {
          authSessionSecret: "integration-auth-secret-with-at-least-32-chars",
          rateLimitSecret: "integration-rate-limit-secret-with-at-least-32-chars",
          tokenHashPepper: "integration-token-pepper-with-at-least-32-chars",
        },
      }),
    ).resolves.toMatchObject({ error: { code: "invalid_credentials" }, success: false });
  });

  it("refuses email collision instead of auto-linking", async () => {
    const suffix = randomUUID();
    const email = `collision-${suffix}@example.com`;
    await registerAccount({ email, password: "qa-auth-seq-1234567890!" });

    await expect(
      resolveGoogleOidcAccount({
        email,
        issuer: "https://accounts.google.com",
        subject: suffix,
      }),
    ).resolves.toEqual({ accountId: null, outcome: "collision" });

    const sql = getDatabase();
    const identities = await sql`
      select id from public.account_oidc_identities where subject = ${suffix}
    `;
    expect(identities).toHaveLength(0);
  });

  it("serializes concurrent signup attempts", async () => {
    const suffix = randomUUID();
    const identity = {
      email: `race-${suffix}@example.com`,
      issuer: "https://accounts.google.com",
      subject: suffix,
    };
    const results = await Promise.all([
      resolveGoogleOidcAccount(identity),
      resolveGoogleOidcAccount(identity),
    ]);
    expect(results.map((result) => result.outcome).sort()).toEqual(["created", "existing"]);
    expect(results[0]?.accountId).toBe(results[1]?.accountId);
  });
});

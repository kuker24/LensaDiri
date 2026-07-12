import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { createConsentRecord, revokeConsentRecord } from "@/server/repositories/consents";
import { createAccount, findAccountForAuthentication } from "@/server/repositories/accounts";
import {
  getActiveSession,
  loginAccount,
  logoutAccount,
  registerAccount,
} from "@/server/services/auth";
import {
  createAccountSession,
  findSessionByTokenHash,
  revokeAccountSession,
} from "@/server/repositories/sessions";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

afterAll(async () => {
  await closeDatabaseForTests();
});

describe("Phase 1 trusted database boundary", () => {
  it("has migrated schema with forced RLS and no browser policies", async () => {
    const sql = getDatabase();
    const tables = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('accounts', 'account_sessions', 'consents', 'rate_limits', 'audit_logs')
      order by table_name
    `;
    const rls = await sql<{ relforcerowsecurity: boolean; relrowsecurity: boolean }[]>`
      select relrowsecurity, relforcerowsecurity
      from pg_class
      where oid = 'public.accounts'::regclass
    `;
    const policies = await sql<{ count: number }[]>`
      select count(*)::integer as count
      from pg_policies
      where schemaname = 'public'
        and tablename in ('accounts', 'account_sessions', 'consents', 'rate_limits', 'audit_logs')
    `;

    expect(tables.map((table) => table.table_name)).toEqual([
      "account_sessions",
      "accounts",
      "audit_logs",
      "consents",
      "rate_limits",
    ]);
    expect(rls).toEqual([{ relforcerowsecurity: true, relrowsecurity: true }]);
    expect(policies).toEqual([{ count: 0 }]);
  });

  it("persists account, session lifecycle, consent decisions, and DB fixed-window limits", async () => {
    const suffix = randomUUID();
    const email = `phase1-${suffix}@example.test`;
    const passwordHash = await hashPassword("integration password 123");
    const account = await createAccount({ email, emailNormalized: email, passwordHash });
    const foundAccount = await findAccountForAuthentication(email);
    const tokenHash = hashOpaqueToken(`session-${suffix}`, process.env.TOKEN_HASH_PEPPER!);
    const expiresAt = new Date(Date.now() + 60_000);

    await createAccountSession({
      accountId: account.id,
      expiresAt,
      ipHash: null,
      sessionTokenHash: tokenHash,
      userAgentHash: null,
    });
    const beforeRevocation = await findSessionByTokenHash(tokenHash);
    const revoked = await revokeAccountSession(tokenHash);
    const afterRevocation = await findSessionByTokenHash(tokenHash);
    const consent = await createConsentRecord({
      accepted: true,
      consentType: "assessment_processing",
      subject: { accountId: account.id },
      version: "2026-07-12",
    });
    const consentRevoked = await revokeConsentRecord(consent.id);
    const rateLimitNow = new Date("2026-07-12T12:00:00.000Z");
    const rateLimits = await Promise.all(
      Array.from({ length: 4 }, () =>
        consumeRateLimit(
          `test-${suffix}`,
          authRateLimitPolicies.register,
          process.env.RATE_LIMIT_SECRET!,
          rateLimitNow,
        ),
      ),
    );

    expect(foundAccount).toMatchObject({ id: account.id, status: "active" });
    expect(beforeRevocation).toMatchObject({ accountId: account.id, revokedAt: null });
    expect(revoked).toBe(true);
    expect(afterRevocation?.revokedAt).toBeInstanceOf(Date);
    expect(consentRevoked).toBe(true);
    expect(rateLimits.map((limit) => limit.allowed)).toEqual([true, true, true, false]);
  }, 30_000);

  it("keeps duplicate registration opaque and supports login, expiry, and idempotent logout", async () => {
    const suffix = randomUUID();
    const email = `auth-${suffix}@example.test`;
    const password = "integration password 123";
    const fingerprint = { ip: "127.0.0.1", userAgent: "vitest" };
    const secrets = {
      authSessionSecret: process.env.AUTH_SESSION_SECRET!,
      tokenHashPepper: process.env.TOKEN_HASH_PEPPER!,
    };

    const firstRegistration = await registerAccount({ email, password });
    const duplicateRegistration = await registerAccount({ email, password });
    const invalidLogin = await loginAccount({
      email,
      fingerprint,
      password: "wrong integration password",
      secrets,
    });
    const session = await loginAccount({ email, fingerprint, password, secrets });

    expect(firstRegistration).toEqual({ created: true });
    expect(duplicateRegistration).toEqual({ created: false });
    expect(invalidLogin).toBeNull();
    expect(session).not.toBeNull();

    const active = await getActiveSession(session!.token, secrets.tokenHashPepper);
    const expired = await getActiveSession(
      session!.token,
      secrets.tokenHashPepper,
      session!.expiresAt,
    );
    await logoutAccount(session!.token, secrets.tokenHashPepper);
    await logoutAccount(session!.token, secrets.tokenHashPepper);
    const loggedOut = await getActiveSession(session!.token, secrets.tokenHashPepper);

    expect(active?.accountStatus).toBe("active");
    expect(expired).toBeNull();
    expect(loggedOut).toBeNull();
  }, 60_000);
});

import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { createAccount, findAccountForAuthentication } from "@/server/repositories/accounts";
import { loginAccount, registerAccount } from "@/server/services/auth";
import { createLoginSessionWithAudit } from "@/server/repositories/sessions";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { SESSION_DURATION_MS } from "@/lib/auth/session";
import {
  isFeatureEnabledBatch,
  listAssessmentModeProfiles,
  listCatalogModules,
  listComboPresets,
} from "@/server/repositories/catalog";

afterAll(async () => {
  await closeDatabaseForTests();
});

describe("login atomic session + audit lifecycle", () => {
  it("creates session and audit log atomically via createLoginSessionWithAudit", async () => {
    const suffix = randomUUID();
    const email = `atomic-${suffix}@example.test`;
    const passwordHash = await hashPassword("atomic test password");
    const account = await createAccount({
      email,
      emailNormalized: email,
      passwordHash,
    });

    const secrets = {
      authSessionSecret: process.env.AUTH_SESSION_SECRET!,
      tokenHashPepper: process.env.TOKEN_HASH_PEPPER!,
    };

    const correlationId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const result = await createLoginSessionWithAudit({
      accountId: account.id,
      correlationId,
      expiresAt,
      fingerprint: { ip: "127.0.0.1", userAgent: "vitest-atomic" },
      secrets,
    });

    expect(result.token).toBeTruthy();
    expect(result.expiresAt).toEqual(expiresAt);

    const sql = getDatabase();
    const tokenHash = hashOpaqueToken(result.token, secrets.tokenHashPepper);

    const [session] = await sql<{ id: string; account_id: string; revoked_at: Date | null }[]>`
      select id, account_id, revoked_at
      from public.account_sessions
      where session_token_hash = ${tokenHash}
    `;
    expect(session).toMatchObject({ account_id: account.id, revoked_at: null });

    const [audit] = await sql<{ action: string; actor_account_id: string; entity_type: string }[]>`
      select action, actor_account_id, entity_type
      from public.audit_logs
      where entity_id = ${account.id}
        and action = 'account_login_succeeded'
      order by created_at desc
      limit 1
    `;
    expect(audit).toMatchObject({
      action: "account_login_succeeded",
      actor_account_id: account.id,
      entity_type: "account",
    });
  }, 30_000);

  it("returns failure union for invalid credentials without creating a session", async () => {
    const suffix = randomUUID();
    const email = `invalid-${suffix}@example.test`;
    await registerAccount({ email, password: "correct password" });

    const secrets = {
      authSessionSecret: process.env.AUTH_SESSION_SECRET!,
      rateLimitSecret: process.env.RATE_LIMIT_SECRET!,
      tokenHashPepper: process.env.TOKEN_HASH_PEPPER!,
    };

    const result = await loginAccount({
      email,
      fingerprint: { ip: "127.0.0.1", userAgent: "vitest-invalid" },
      password: "wrong password",
      secrets,
    });

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({ code: "invalid_credentials", status: 401 }),
    });

    const account = await findAccountForAuthentication(email);
    expect(account).not.toBeNull();

    const sql = getDatabase();
    const rows = await sql<{ count: number }[]>`
      select count(*)::integer as count
      from public.account_sessions
      where account_id = ${account!.id}
    `;
    const sessions = rows[0];
    expect(sessions?.count).toBe(0);
  }, 30_000);

  it("returns rate_limited union with retryAfterSeconds after policy limit exceeded", async () => {
    const suffix = randomUUID();
    const email = `ratelimit-${suffix}@example.test`;
    await registerAccount({ email, password: "ratelimit password" });

    const secrets = {
      authSessionSecret: process.env.AUTH_SESSION_SECRET!,
      rateLimitSecret: process.env.RATE_LIMIT_SECRET!,
      tokenHashPepper: process.env.TOKEN_HASH_PEPPER!,
    };

    const results: Awaited<ReturnType<typeof loginAccount>>[] = [];
    for (let i = 0; i < 7; i++) {
      results.push(
        await loginAccount({
          email,
          fingerprint: { ip: "127.0.0.1", userAgent: "vitest-ratelimit" },
          password: "ratelimit password",
          secrets,
        }),
      );
    }

    const rateLimited = results.filter((r) => !r.success && r.error.code === "rate_limited");
    expect(rateLimited.length).toBeGreaterThan(0);

    const firstRateLimited = rateLimited[0] as {
      success: false;
      error: { code: "rate_limited"; retryAfterSeconds: number; status: 429 };
    };
    expect(firstRateLimited.error.retryAfterSeconds).toBeGreaterThan(0);
    expect(firstRateLimited.error.status).toBe(429);
  }, 60_000);

  it("rolls back session insert when audit insert fails inside transaction", async () => {
    const sql = getDatabase();
    const secrets = {
      authSessionSecret: process.env.AUTH_SESSION_SECRET!,
      tokenHashPepper: process.env.TOKEN_HASH_PEPPER!,
    };

    const fakeAccountId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const correlationId = randomUUID();

    const sessionsBefore = await sql<{ count: number }[]>`
      select count(*)::integer as count from public.account_sessions where account_id = ${fakeAccountId}`;
    const auditsBefore = await sql<{ count: number }[]>`
      select count(*)::integer as count from public.audit_logs
      where entity_id = ${fakeAccountId} and action = 'account_login_succeeded'`;

    await expect(
      createLoginSessionWithAudit({
        accountId: fakeAccountId,
        correlationId,
        expiresAt,
        fingerprint: { ip: "127.0.0.1", userAgent: "vitest-rollback" },
        secrets,
      }),
    ).rejects.toThrow();

    const sessionsAfter = await sql<{ count: number }[]>`
      select count(*)::integer as count from public.account_sessions where account_id = ${fakeAccountId}`;
    const auditsAfter = await sql<{ count: number }[]>`
      select count(*)::integer as count from public.audit_logs
      where entity_id = ${fakeAccountId} and action = 'account_login_succeeded'`;

    expect(sessionsAfter[0]?.count).toBe(sessionsBefore[0]?.count ?? 0);
    expect(auditsAfter[0]?.count).toBe(auditsBefore[0]?.count ?? 0);
  }, 15_000);
});

describe("catalog batch and sequential queries", () => {
  it("fetches multiple feature flags in a single batch query", async () => {
    const flags = await isFeatureEnabledBatch([
      "FEATURE_MODULAR_COMPOSER",
      "FEATURE_PROVISIONAL_PRECISION",
      "FEATURE_COMPLEX_MODE",
    ]);

    expect(Object.keys(flags)).toHaveLength(3);
    expect(typeof flags["FEATURE_MODULAR_COMPOSER"]).toBe("boolean");
    expect(typeof flags["FEATURE_PROVISIONAL_PRECISION"]).toBe("boolean");
    expect(typeof flags["FEATURE_COMPLEX_MODE"]).toBe("boolean");
  }, 10_000);

  it("returns false defaults for unknown flag keys in batch", async () => {
    const flags = await isFeatureEnabledBatch(["FEATURE_NONEXISTENT_A", "FEATURE_NONEXISTENT_B"]);

    expect(flags["FEATURE_NONEXISTENT_A"]).toBe(false);
    expect(flags["FEATURE_NONEXISTENT_B"]).toBe(false);
  }, 10_000);

  it("loads catalog context sequentially without Promise.all contention", async () => {
    const startMs = Date.now();
    const modules = await listCatalogModules();
    const combos = await listComboPresets();
    const modeProfiles = await listAssessmentModeProfiles();
    const flags = await isFeatureEnabledBatch([
      "FEATURE_MODULAR_COMPOSER",
      "FEATURE_PROVISIONAL_PRECISION",
      "FEATURE_COMPLEX_MODE",
    ]);
    const durationMs = Date.now() - startMs;

    expect(modules.length).toBeGreaterThan(0);
    expect(combos.length).toBeGreaterThan(0);
    expect(modeProfiles.length).toBeGreaterThan(0);
    expect(typeof flags["FEATURE_MODULAR_COMPOSER"]).toBe("boolean");

    console.log(
      `[INTEGRATION] Sequential catalog load completed in ${durationMs}ms with pool max=1`,
    );
  }, 15_000);
});

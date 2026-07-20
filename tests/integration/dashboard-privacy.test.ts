import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import {
  completeAssessment,
  getAssessmentSessionByHash,
  getResultByHash,
  saveAssessmentAnswer,
} from "@/server/repositories/assessment";
import { findAccountForAuthentication } from "@/server/repositories/accounts";
import {
  listAccountActiveSessions,
  listAccountDashboardResults,
  rotateAccountResultToken,
  rotateAccountSessionToken,
} from "@/server/repositories/dashboard";
import {
  listAccountConsentPolicies,
  recordAccountOptionalConsent,
} from "@/server/repositories/privacy";
import { startAssessment } from "@/server/services/assessment";
import { deleteAccount, loginAccount, registerAccount } from "@/server/services/auth";

const pepper = process.env.TOKEN_HASH_PEPPER!;

afterAll(async () => {
  const sql = getDatabase();
  await sql`update public.feature_flags set enabled = false where key = 'FEATURE_MODULAR_COMPOSER'`;
  await closeDatabaseForTests();
});

describe("dashboard and privacy account lifecycle", () => {
  it("lists, resumes, opens, records consent, and hard-deletes modular data", async () => {
    const sql = getDatabase();
    await sql`update public.feature_flags set enabled = true where key = 'FEATURE_MODULAR_COMPOSER'`;

    const suffix = randomUUID();
    const email = `dashboard-${suffix}@example.test`;
    const password = "integration password 123";
    const secrets = {
      authSessionSecret: process.env.AUTH_SESSION_SECRET!,
      rateLimitSecret: process.env.RATE_LIMIT_SECRET!,
      tokenHashPepper: pepper,
    };

    await registerAccount({ email, password });
    const account = await findAccountForAuthentication(email);
    const loginResult = await loginAccount({
      email,
      fingerprint: { ip: "127.0.0.1", userAgent: "vitest-dashboard" },
      password,
      secrets,
    });
    if (!loginResult.success) {
      throw new Error(`Login failed: ${JSON.stringify(loginResult)}`);
    }
    const authSession = loginResult.data;
    expect(account).not.toBeNull();
    expect(authSession).not.toBeNull();

    const initialSessionHash = hashOpaqueToken(`dashboard-session-${suffix}`, pepper);
    await expect(
      startAssessment({
        accountId: account!.id,
        consentVersion: "prd-v2-1",
        expiresAt: new Date(Date.now() + 10 * 60_000),
        request: {
          kind: "modular",
          locale: "id",
          selection: {
            age: 18,
            experimentalAcknowledged: false,
            mode: "quick",
            moduleKeys: ["trait_profile"],
            presetKey: null,
            selectionType: "single",
          },
        },
        sessionTokenHash: initialSessionHash,
      }),
    ).resolves.toEqual({ kind: "modular", success: true });

    await expect(listAccountActiveSessions(account!.id)).resolves.toEqual([
      expect.objectContaining({
        answeredCount: 0,
        moduleKeys: ["trait_profile"],
        status: "active",
        totalCount: 40,
      }),
    ]);

    const resumedSessionHash = hashOpaqueToken(`dashboard-resumed-${suffix}`, pepper);
    await expect(
      rotateAccountSessionToken({
        accountId: account!.id,
        sessionId: (await listAccountActiveSessions(account!.id))[0]!.id,
        sessionTokenHash: resumedSessionHash,
      }),
    ).resolves.toBe(true);
    await expect(getAssessmentSessionByHash(initialSessionHash)).resolves.toBeNull();

    const assessment = await getAssessmentSessionByHash(resumedSessionHash);
    expect(assessment).not.toBeNull();
    for (const [index, question] of assessment!.questions.entries()) {
      await expect(
        saveAssessmentAnswer({
          idempotencyKey: randomUUID(),
          questionId: question.id,
          rawValue: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          responseTimeMs: 1_800,
          sessionTokenHash: resumedSessionHash,
        }),
      ).resolves.toBe(true);
    }

    const initialResultHash = hashOpaqueToken(`dashboard-result-${suffix}`, pepper);
    const completion = await completeAssessment({
      resultTokenHash: initialResultHash,
      sessionTokenHash: resumedSessionHash,
    });
    expect(completion).toEqual({ resultId: expect.any(String) });
    await expect(listAccountActiveSessions(account!.id)).resolves.toEqual([]);

    const results = await listAccountDashboardResults(account!.id);
    expect(results).toEqual([
      expect.objectContaining({
        activeShareCount: 0,
        moduleKeys: ["trait_profile"],
      }),
    ]);

    const openedResultHash = hashOpaqueToken(`dashboard-opened-result-${suffix}`, pepper);
    await expect(
      rotateAccountResultToken({
        accountId: account!.id,
        resultId: results[0]!.id,
        resultTokenHash: openedResultHash,
      }),
    ).resolves.toBe(true);
    await expect(getResultByHash(initialResultHash)).resolves.toBeNull();
    await expect(getResultByHash(openedResultHash)).resolves.toMatchObject({ kind: "modular" });

    const optionalPolicy = (await listAccountConsentPolicies(account!.id)).find(
      (policy) => policy.consentType === "research_optional",
    );
    expect(optionalPolicy).toMatchObject({ decision: "not_set", requiredForCore: false });
    await expect(
      recordAccountOptionalConsent({
        accepted: true,
        accountId: account!.id,
        consentType: "research_optional",
        version: optionalPolicy!.version,
      }),
    ).resolves.toBe(true);
    await expect(listAccountConsentPolicies(account!.id)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ consentType: "research_optional", decision: "accepted" }),
      ]),
    );

    await expect(
      deleteAccount({
        password,
        sessionToken: authSession!.token,
        tokenHashPepper: pepper,
      }),
    ).resolves.toBe("deleted");

    const [counts] = await sql<
      {
        accounts: number;
        consents: number;
        result_modules: number;
        results: number;
        test_sessions: number;
      }[]
    >`
      select
        (select count(*)::integer from public.accounts where id = ${account!.id}) as accounts,
        (select count(*)::integer from public.consents where account_id = ${account!.id}) as consents,
        (select count(*)::integer from public.test_sessions where account_id = ${account!.id}) as test_sessions,
        (select count(*)::integer from public.personality_results where account_id = ${account!.id}) as results,
        (select count(*)::integer from public.result_modules
          where result_id = ${results[0]!.id}) as result_modules
    `;
    expect(counts).toEqual({
      accounts: 0,
      consents: 0,
      result_modules: 0,
      results: 0,
      test_sessions: 0,
    });
  }, 180_000);
});

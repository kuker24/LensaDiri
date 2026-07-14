import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import {
  completeAssessment,
  createResultShare,
  deleteResultByHash,
  getAssessmentSessionByHash,
  getResultByHash,
  getSharedResultByHash,
  resolveClarifier,
  saveAssessmentAnswer,
  saveClarifierAnswer,
  startClarifier,
} from "@/server/repositories/assessment";
import { startAssessment } from "@/server/services/assessment";

const pepper = process.env.TOKEN_HASH_PEPPER!;

beforeAll(async () => {
  const sql = getDatabase();
  await sql`update public.feature_flags set enabled = true where key = 'FEATURE_MODULAR_COMPOSER'`;
});

afterAll(async () => {
  const sql = getDatabase();
  await sql`update public.feature_flags set enabled = false where key = 'FEATURE_MODULAR_COMPOSER'`;
  await closeDatabaseForTests();
});

async function startAndAnswer(
  moduleKeys: string[],
  valueFor: (index: number) => 1 | 2 | 3 | 4 | 5,
) {
  const sessionHash = hashOpaqueToken(`modular-completion-${randomUUID()}`, pepper);
  await expect(
    startAssessment({
      accountId: null,
      consentVersion: "test-v2",
      expiresAt: new Date(Date.now() + 120_000),
      request: {
        kind: "modular",
        locale: "id",
        selection: {
          age: 18,
          experimentalAcknowledged: false,
          mode: "quick",
          moduleKeys,
          presetKey: null,
          selectionType: moduleKeys.length === 1 ? "single" : "custom_combo",
        },
      },
      sessionTokenHash: sessionHash,
    }),
  ).resolves.toEqual({ kind: "modular", success: true });
  const session = await getAssessmentSessionByHash(sessionHash);
  expect(session?.questions.length).toBeGreaterThan(0);
  for (const [index, question] of session!.questions.entries()) {
    await expect(
      saveAssessmentAnswer({
        idempotencyKey: randomUUID(),
        questionId: question.id,
        rawValue: valueFor(index),
        responseTimeMs: 1_500,
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toBe(true);
  }
  return sessionHash;
}

describe("modular completion PostgreSQL lifecycle", () => {
  it("completes one lens atomically, reads retry-safe DTO, shares, and deletes", async () => {
    const sessionHash = await startAndAnswer(
      ["type_16"],
      (index) => ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    );
    const resultHash = hashOpaqueToken(`modular-result-${randomUUID()}`, pepper);
    const shareHash = hashOpaqueToken(`modular-share-${randomUUID()}`, pepper);

    const completion = await completeAssessment({
      resultTokenHash: resultHash,
      sessionTokenHash: sessionHash,
    });
    expect(completion).toEqual({ resultId: expect.any(String) });
    await expect(
      completeAssessment({
        resultTokenHash: hashOpaqueToken(`different-retry-${randomUUID()}`, pepper),
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toEqual(completion);

    const result = await getResultByHash(resultHash);
    expect(result).toMatchObject({ kind: "modular", summary: { moduleKeys: ["type_16"] } });
    if (result?.kind !== "modular") throw new Error("Expected modular result.");
    expect(result.modules).toHaveLength(1);
    expect(result.modules[0]?.scores).toHaveLength(4);

    await expect(
      createResultShare({
        expiresAt: new Date(Date.now() + 60_000),
        resultTokenHash: resultHash,
        shareTokenHash: shareHash,
      }),
    ).resolves.toBe(true);
    await expect(getSharedResultByHash(shareHash)).resolves.toMatchObject({ kind: "modular" });
    await expect(deleteResultByHash(resultHash)).resolves.toBe(true);
    await expect(getResultByHash(resultHash)).resolves.toBeNull();
  }, 120_000);

  it("persists independent combo modules, correlations, and immutable version provenance", async () => {
    const sql = getDatabase();
    const sessionHash = await startAndAnswer(
      ["type_16", "temperament"],
      (index) => ((index % 4) + 1) as 1 | 2 | 3 | 4,
    );
    const resultHash = hashOpaqueToken(`combo-result-${randomUUID()}`, pepper);
    const completion = await completeAssessment({
      resultTokenHash: resultHash,
      sessionTokenHash: sessionHash,
    });
    expect(completion).toEqual({ resultId: expect.any(String) });

    const result = await getResultByHash(resultHash);
    expect(result?.kind).toBe("modular");
    if (result?.kind !== "modular") throw new Error("Expected modular combo result.");
    expect(new Set(result.modules.map((module) => module.moduleKey))).toEqual(
      new Set(["type_16", "temperament"]),
    );
    expect(result.correlations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleKey: "expression_type16_temperament" }),
      ]),
    );

    const [stored] = await sql<{ correlations: number; modules: number; versions: number }[]>`
      select
        (select count(*)::integer from public.result_modules where result_id = personality_results.id) as modules,
        (select count(*)::integer from public.result_correlations where result_id = personality_results.id) as correlations,
        (select count(*)::integer from public.result_versions where result_id = personality_results.id) as versions
      from public.personality_results where result_token_hash = ${resultHash}
    `;
    expect(stored).toEqual({ correlations: 1, modules: 2, versions: 1 });
  }, 120_000);

  it("requires, starts, answers, and completes supplemental clarifier once", async () => {
    const sql = getDatabase();
    const sessionHash = await startAndAnswer(["enneagram"], () => 3);
    const resultHash = hashOpaqueToken(`clarified-result-${randomUUID()}`, pepper);

    const firstCompletion = await completeAssessment({
      resultTokenHash: resultHash,
      sessionTokenHash: sessionHash,
    });
    expect(firstCompletion).toMatchObject({ status: "clarifier_required" });
    const clarifier = await startClarifier(sessionHash);
    expect(clarifier).toMatchObject({ status: "in_progress", totalCount: expect.any(Number) });
    expect(clarifier!.totalCount).toBeGreaterThanOrEqual(12);
    expect(clarifier!.totalCount).toBeLessThanOrEqual(24);
    await expect(startClarifier(sessionHash)).resolves.toEqual(clarifier);

    for (const [index, question] of clarifier!.questions.entries()) {
      await expect(
        saveClarifierAnswer({
          questionId: question.id,
          rawValue: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          responseTimeMs: 1_800,
          sessionTokenHash: sessionHash,
        }),
      ).resolves.toBe(true);
    }
    const resolved = await resolveClarifier({
      action: "complete",
      resultTokenHash: resultHash,
      sessionTokenHash: sessionHash,
    });
    expect(resolved).toEqual({ resultId: expect.any(String) });
    await expect(
      resolveClarifier({
        action: "complete",
        resultTokenHash: resultHash,
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toEqual(resolved);
    await expect(getResultByHash(resultHash)).resolves.toMatchObject({ kind: "modular" });

    const [stored] = await sql<{ answers: number; results: number; status: string }[]>`
      select result_clarifiers.status::text as status,
        (select count(*)::integer from public.result_clarifier_answers
          inner join public.result_clarifier_items
            on result_clarifier_items.id = result_clarifier_answers.clarifier_item_id
          where result_clarifier_items.clarifier_id = result_clarifiers.id) as answers,
        (select count(*)::integer from public.personality_results
          where session_id = result_clarifiers.session_id) as results
      from public.result_clarifiers
      inner join public.test_sessions on test_sessions.id = result_clarifiers.session_id
      where test_sessions.session_token_hash = ${sessionHash}
    `;
    expect(stored).toEqual({ answers: clarifier!.totalCount, results: 1, status: "completed" });
  }, 120_000);

  it("allows explicit clarifier skip and marks quality honestly", async () => {
    const sql = getDatabase();
    const sessionHash = await startAndAnswer(["enneagram"], () => 3);
    const resultHash = hashOpaqueToken(`skipped-result-${randomUUID()}`, pepper);
    await expect(
      completeAssessment({ resultTokenHash: resultHash, sessionTokenHash: sessionHash }),
    ).resolves.toMatchObject({ status: "clarifier_required" });
    await expect(
      resolveClarifier({
        action: "skip",
        resultTokenHash: resultHash,
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toEqual({ resultId: expect.any(String) });
    const result = await getResultByHash(resultHash);
    expect(result?.kind).toBe("modular");
    if (result?.kind !== "modular") throw new Error("Expected modular result.");
    expect(result.quality.flags).toContain("clarifier_skipped");
    const [stored] = await sql<{ status: string }[]>`
      select result_clarifiers.status::text as status
      from public.result_clarifiers
      inner join public.test_sessions on test_sessions.id = result_clarifiers.session_id
      where test_sessions.session_token_hash = ${sessionHash}
    `;
    expect(stored?.status).toBe("skipped");
  }, 120_000);
});

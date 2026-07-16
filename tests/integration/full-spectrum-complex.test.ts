import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AssessmentMode } from "@/lib/assessment/catalog";
import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import {
  completeAssessment,
  getAssessmentSessionByHash,
  getResultByHash,
  resolveClarifier,
  saveAssessmentAnswer,
  setAssessmentPaused,
} from "@/server/repositories/assessment";
import { startAssessment } from "@/server/services/assessment";

const moduleKeys = ["trait_profile", "type_16", "enneagram", "temperament"] as const;
const pepper = process.env.TOKEN_HASH_PEPPER!;

beforeAll(async () => {
  const sql = getDatabase();
  await sql`
    update public.feature_flags
    set enabled = true
    where key in ('FEATURE_MODULAR_COMPOSER', 'FEATURE_COMPLEX_MODE')
  `;
});

afterAll(async () => {
  const sql = getDatabase();
  await sql`
    update public.feature_flags
    set enabled = false
    where key in ('FEATURE_MODULAR_COMPOSER', 'FEATURE_COMPLEX_MODE')
  `;
  await closeDatabaseForTests();
});

async function runFullSpectrum(mode: AssessmentMode) {
  const sessionTokenHash = hashOpaqueToken(`full-spectrum-${mode}-${randomUUID()}`, pepper);
  const resultTokenHash = hashOpaqueToken(`full-spectrum-result-${mode}-${randomUUID()}`, pepper);

  await expect(
    startAssessment({
      accountId: null,
      consentVersion: "prd-v2-1",
      expiresAt: new Date(Date.now() + 10 * 60_000),
      request: {
        kind: "modular",
        locale: "id",
        selection: {
          age: 18,
          experimentalAcknowledged: false,
          mode,
          moduleKeys,
          presetKey: "full_spectrum",
          selectionType: "full_spectrum",
        },
      },
      sessionTokenHash,
    }),
  ).resolves.toEqual({ kind: "modular", success: true });

  const initial = await getAssessmentSessionByHash(sessionTokenHash);
  expect(initial).not.toBeNull();
  expect(new Set(initial!.questions.map((question) => question.moduleKey))).toEqual(
    new Set(moduleKeys),
  );

  if (mode === "standard") {
    expect(initial!.totalCount).toBeGreaterThanOrEqual(80);
    expect(initial!.totalCount).toBeLessThanOrEqual(90);
    expect(initial!.segmentCount).toBe(1);
  } else {
    expect(initial!.totalCount).toBeGreaterThanOrEqual(100);
    expect(initial!.totalCount).toBeLessThanOrEqual(120);
    expect(initial!.segmentCount).toBeGreaterThanOrEqual(2);
  }

  for (const [index, question] of initial!.questions.entries()) {
    if (index === 8) {
      await expect(setAssessmentPaused(sessionTokenHash, true)).resolves.toBe(true);
      await expect(getAssessmentSessionByHash(sessionTokenHash)).resolves.toMatchObject({
        answeredCount: 8,
        status: "paused",
      });
      await expect(setAssessmentPaused(sessionTokenHash, false)).resolves.toBe(true);
      const reloaded = await getAssessmentSessionByHash(sessionTokenHash);
      expect(reloaded?.questions).toEqual(initial!.questions);
      expect(reloaded).toMatchObject({ answeredCount: 8, status: "active" });
    }

    await expect(
      saveAssessmentAnswer({
        idempotencyKey: randomUUID(),
        questionId: question.id,
        rawValue: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        responseTimeMs: 1_600 + (index % 7) * 120,
        sessionTokenHash,
      }),
    ).resolves.toBe(true);
  }

  const completion = await completeAssessment({ resultTokenHash, sessionTokenHash });
  if (completion !== null && "status" in completion && completion.status === "clarifier_required") {
    await expect(
      resolveClarifier({
        action: "skip",
        resultTokenHash,
        sessionTokenHash,
      }),
    ).resolves.toEqual({ resultId: expect.any(String) });
  } else {
    expect(completion).toEqual({ resultId: expect.any(String) });
  }

  await expect(completeAssessment({ resultTokenHash, sessionTokenHash })).resolves.toEqual({
    resultId: expect.any(String),
  });

  const result = await getResultByHash(resultTokenHash);
  expect(result?.kind).toBe("modular");
  if (result?.kind !== "modular") throw new Error("Expected a modular Full Spectrum result.");
  expect(new Set(result.modules.map((module) => module.moduleKey))).toEqual(new Set(moduleKeys));

  const sql = getDatabase();
  const [stored] = await sql<
    { completed_segments: number; result_count: number; segment_count: number; status: string }[]
  >`
    select
      test_sessions.status::text as status,
      (select count(*)::integer from public.test_session_segments
        where session_id = test_sessions.id) as segment_count,
      (select count(*)::integer from public.test_session_segments
        where session_id = test_sessions.id and status = 'completed') as completed_segments,
      (select count(*)::integer from public.personality_results
        where session_id = test_sessions.id and deleted_at is null) as result_count
    from public.test_sessions
    where session_token_hash = ${sessionTokenHash}
  `;
  expect(stored).toEqual({
    completed_segments: initial!.segmentCount,
    result_count: 1,
    segment_count: initial!.segmentCount,
    status: "completed",
  });
}

describe("Full Spectrum PRD v2 lifecycle", () => {
  it("completes Full Spectrum Normal atomically", async () => {
    await runFullSpectrum("standard");
  }, 180_000);

  it("completes Full Spectrum Complex across pause, resume, and reload", async () => {
    await runFullSpectrum("deep");
  }, 240_000);
});

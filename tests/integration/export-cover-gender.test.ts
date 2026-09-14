import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { identityJourneyModuleKeys } from "@/lib/assessment/identity-journey";
import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { buildResultPdfModel } from "@/server/export/result-pdf-model";
import {
  completeAssessment,
  getAssessmentSessionByHash,
  getResultByHash,
  getResultCharacterGender,
  saveAssessmentAnswer,
} from "@/server/repositories/assessment";
import { startAssessment } from "@/server/services/assessment";

const pepper = process.env.TOKEN_HASH_PEPPER!;

beforeAll(async () => {
  const sql = getDatabase();
  await sql`
    update public.feature_flags set enabled = true
    where key in ('FEATURE_MODULAR_COMPOSER', 'FEATURE_COMPLEX_MODE')
  `;
});

afterAll(async () => {
  const sql = getDatabase();
  await sql`
    update public.feature_flags set enabled = false
    where key in ('FEATURE_MODULAR_COMPOSER', 'FEATURE_COMPLEX_MODE')
  `;
  await closeDatabaseForTests();
});

/** Runs one combined sitting to completion and returns the result token hash. */
async function completeJourney(characterGender: "laki" | "perempuan") {
  const sessionTokenHash = hashOpaqueToken(`cover-session-${randomUUID()}`, pepper);
  const journeyTokenHash = hashOpaqueToken(`cover-journey-${randomUUID()}`, pepper);
  const started = await startAssessment({
    accountId: null,
    consentVersion: "identity-journey-1",
    expiresAt: new Date(Date.now() + 120_000),
    request: {
      journey: { characterGender, combined: true, journeyTokenHash, kind: "create" },
      kind: "modular",
      locale: "id",
      selection: {
        age: 18,
        experimentalAcknowledged: true,
        mode: "deep",
        moduleKeys: [...identityJourneyModuleKeys],
        presetKey: null,
        selectionType: "custom_combo",
      },
    },
    sessionTokenHash,
  });
  expect(started).toEqual({ kind: "modular", success: true });

  const session = await getAssessmentSessionByHash(sessionTokenHash);
  for (const [index, question] of session!.questions.entries()) {
    await saveAssessmentAnswer({
      idempotencyKey: randomUUID(),
      questionId: question.id,
      rawValue: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      responseTimeMs: 1_500,
      sessionTokenHash,
    });
  }

  const resultTokenHash = hashOpaqueToken(`cover-result-${randomUUID()}`, pepper);
  await expect(completeAssessment({ resultTokenHash, sessionTokenHash })).resolves.toMatchObject({
    resultId: expect.any(String),
  });
  return { journeyTokenHash, resultTokenHash };
}

describe("PDF cover honours the picked body", () => {
  it("reads the gender the journey was started with, for both bodies", async () => {
    // The bug this covers: the cover resolved `{CODE}.png` by type alone, so a
    // visitor who picked the male body could download a female cover. The value
    // is authoritative in `identity_journeys.character_gender`.
    for (const gender of ["laki", "perempuan"] as const) {
      const { resultTokenHash } = await completeJourney(gender);
      await expect(getResultCharacterGender(resultTokenHash)).resolves.toBe(gender);
    }
  }, 120_000);

  it("puts that body on the cover figurine the export renders", async () => {
    const { resultTokenHash } = await completeJourney("laki");
    const gender = await getResultCharacterGender(resultTokenHash);
    const result = await getResultByHash(resultTokenHash);
    expect(result).not.toBeNull();

    const model = buildResultPdfModel(result!, new Date(), gender);
    expect(model.cover.typeCode).toMatch(/^[EI][NS][TF][JP]$/u);
    expect(model.cover.figurinePath).toMatch(/-laki\.png$/u);

    // Same result, body withheld: the neutral render, never a guessed body.
    const neutral = buildResultPdfModel(result!, new Date(), null);
    expect(neutral.cover.figurinePath).not.toMatch(/-(laki|perempuan)\.png$/u);
    expect(neutral.cover.figurinePath).toMatch(/[EI][NS][TF][JP]\.png$/u);
  }, 120_000);

  it("returns null for an unknown result rather than defaulting to a body", async () => {
    const orphan = hashOpaqueToken(`cover-missing-${randomUUID()}`, pepper);
    await expect(getResultCharacterGender(orphan)).resolves.toBeNull();
  });

  it("returns null once retention detaches the step from its journey", async () => {
    // `identity_journey_steps.result_id` is `on delete set null`, and the schema
    // comment notes retention cleanup and account erasure may detach a claimed
    // step. A detached result must fall back to the neutral cover, not guess.
    const sql = getDatabase();
    const { resultTokenHash } = await completeJourney("laki");
    await expect(getResultCharacterGender(resultTokenHash)).resolves.toBe("laki");

    await sql`
      update public.identity_journey_steps
      set status = 'available', session_id = null, result_id = null,
        started_at = null, completed_at = null
      where result_id in (
        select id from public.personality_results
        where result_token_hash = ${resultTokenHash}
      )
    `;

    await expect(getResultCharacterGender(resultTokenHash)).resolves.toBeNull();

    const result = await getResultByHash(resultTokenHash);
    const model = buildResultPdfModel(result!, new Date(), null);
    expect(model.cover.figurinePath).not.toMatch(/-(laki|perempuan)\.png$/u);
  }, 120_000);

  it("keeps the picked body out of the browser-facing result view", async () => {
    // The cover is resolved server-side on purpose. Widening `PrivateResultView`
    // would push a new field through every result consumer and past the
    // share-leak guard, so the field must not appear there.
    const { resultTokenHash } = await completeJourney("laki");
    const result = await getResultByHash(resultTokenHash);
    expect(result).not.toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/characterGender|character_gender/u);
  }, 120_000);
});

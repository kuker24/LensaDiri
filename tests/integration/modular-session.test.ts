import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import {
  getAssessmentSessionByHash,
  saveAssessmentAnswer,
  setAssessmentPaused,
} from "@/server/repositories/assessment";
import { startAssessment } from "@/server/services/assessment";

afterAll(async () => {
  const sql = getDatabase();
  await sql`update public.feature_flags set enabled = false where key = 'FEATURE_MODULAR_COMPOSER'`;
  await closeDatabaseForTests();
});

describe("modular session PostgreSQL lifecycle", () => {
  it("fails closed while modular composer flag is disabled", async () => {
    const pepper = process.env.TOKEN_HASH_PEPPER!;
    const sessionHash = hashOpaqueToken(`disabled-${randomUUID()}`, pepper);
    await expect(
      startAssessment({
        accountId: null,
        consentVersion: "test-v2",
        expiresAt: new Date(Date.now() + 60_000),
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
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toEqual({ code: "feature_unavailable", success: false });
    await expect(getAssessmentSessionByHash(sessionHash)).resolves.toBeNull();
  });

  it("persists immutable order, autosaves revisions, pauses, and resumes", async () => {
    const sql = getDatabase();
    await sql`update public.feature_flags set enabled = true where key = 'FEATURE_MODULAR_COMPOSER'`;

    const pepper = process.env.TOKEN_HASH_PEPPER!;
    const sessionHash = hashOpaqueToken(`modular-${randomUUID()}`, pepper);
    await expect(
      startAssessment({
        accountId: null,
        consentVersion: "test-v2",
        expiresAt: new Date(Date.now() + 60_000),
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
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toEqual({ kind: "modular", success: true });

    const firstRead = await getAssessmentSessionByHash(sessionHash);
    const secondRead = await getAssessmentSessionByHash(sessionHash);
    expect(firstRead).toMatchObject({
      answeredCount: 0,
      currentSegmentIndex: 1,
      mode: "quick",
      segmentCount: 1,
      status: "active",
      totalCount: 40,
    });
    expect(secondRead?.questions).toEqual(firstRead?.questions);
    expect(firstRead?.questions.map((question) => question.order)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1),
    );
    expect(new Set(firstRead?.questions.map((question) => question.moduleKey))).toEqual(
      new Set(["trait_profile"]),
    );

    const firstQuestion = firstRead!.questions[0]!;
    await expect(
      saveAssessmentAnswer({
        idempotencyKey: randomUUID(),
        questionId: firstQuestion.id,
        rawValue: 3,
        responseTimeMs: 800,
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toBe(true);
    await expect(
      saveAssessmentAnswer({
        idempotencyKey: randomUUID(),
        questionId: firstQuestion.id,
        rawValue: 4,
        responseTimeMs: 900,
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toBe(true);

    const [revision] = await sql<{ answer_revision: number; raw_value: number }[]>`
      select answer_revision, raw_value
      from public.user_answers
      where session_id = (
        select id from public.test_sessions where session_token_hash = ${sessionHash}
      ) and question_id = ${firstQuestion.id}
    `;
    expect(revision).toEqual({ answer_revision: 2, raw_value: 4 });

    await expect(setAssessmentPaused(sessionHash, true)).resolves.toBe(true);
    await expect(setAssessmentPaused(sessionHash, true)).resolves.toBe(false);
    await expect(getAssessmentSessionByHash(sessionHash)).resolves.toMatchObject({
      status: "paused",
    });
    await expect(
      saveAssessmentAnswer({
        idempotencyKey: randomUUID(),
        questionId: firstRead!.questions[1]!.id,
        rawValue: 4,
        responseTimeMs: 900,
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toBe(false);

    await expect(setAssessmentPaused(sessionHash, false)).resolves.toBe(true);
    await expect(getAssessmentSessionByHash(sessionHash)).resolves.toMatchObject({
      answeredCount: 1,
      status: "active",
    });

    const [persisted] = await sql<
      { blueprint_items: number; blueprint_status: string; modules: number; segments: number }[]
    >`
      select
        assessment_blueprints.status::text as blueprint_status,
        (select count(*)::integer from public.assessment_blueprint_items
          where blueprint_id = assessment_blueprints.id) as blueprint_items,
        (select count(*)::integer from public.test_session_modules
          where session_id = test_sessions.id) as modules,
        (select count(*)::integer from public.test_session_segments
          where session_id = test_sessions.id) as segments
      from public.test_sessions
      inner join public.assessment_blueprints
        on assessment_blueprints.id = test_sessions.blueprint_id
      where test_sessions.session_token_hash = ${sessionHash}
    `;
    expect(persisted).toEqual({
      blueprint_items: 40,
      blueprint_status: "locked",
      modules: 1,
      segments: 1,
    });
  }, 120_000);

  it("retains legacy Quick/Standard adapter while modular flag is enabled", async () => {
    const pepper = process.env.TOKEN_HASH_PEPPER!;
    const sessionHash = hashOpaqueToken(`legacy-adapter-${randomUUID()}`, pepper);
    await expect(
      startAssessment({
        accountId: null,
        consentVersion: "legacy-test",
        expiresAt: new Date(Date.now() + 60_000),
        request: { kind: "legacy", mode: "standard" },
        sessionTokenHash: sessionHash,
      }),
    ).resolves.toEqual({ kind: "legacy", success: true });
    await expect(getAssessmentSessionByHash(sessionHash)).resolves.toMatchObject({
      mode: "standard",
      totalCount: 60,
    });
  });
});

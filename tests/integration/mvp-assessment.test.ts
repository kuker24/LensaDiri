import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import {
  completeAssessment,
  createAssessmentSession,
  createResultFeedback,
  createResultShare,
  deleteResultByHash,
  getAssessmentSessionByHash,
  getResultByHash,
  getSharedResultByHash,
  revokeResultShares,
  saveAssessmentAnswer,
} from "@/server/repositories/assessment";

afterAll(async () => closeDatabaseForTests());

describe("MVP assessment database lifecycle", () => {
  it("autosaves, completes atomically, shares, revokes, and deletes a private result", async () => {
    const pepper = process.env.TOKEN_HASH_PEPPER!;
    const sessionHash = hashOpaqueToken(`session-${randomUUID()}`, pepper);
    const resultHash = hashOpaqueToken(`result-${randomUUID()}`, pepper);
    const shareHash = hashOpaqueToken(`share-${randomUUID()}`, pepper);

    await createAssessmentSession({
      accountId: null,
      consentVersion: "2026-07-13",
      expiresAt: new Date(Date.now() + 60_000),
      mode: "quick",
      sessionTokenHash: sessionHash,
    });
    const session = await getAssessmentSessionByHash(sessionHash);
    expect(session?.questions).toHaveLength(40);

    for (const [index, question] of session!.questions.entries()) {
      await expect(
        saveAssessmentAnswer({
          idempotencyKey: randomUUID(),
          questionId: question.id,
          rawValue: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          responseTimeMs: 1000,
          sessionTokenHash: sessionHash,
        }),
      ).resolves.toBe(true);
    }

    await expect(
      completeAssessment({ resultTokenHash: resultHash, sessionTokenHash: sessionHash }),
    ).resolves.toEqual({ resultId: expect.any(String) });
    const result = await getResultByHash(resultHash);
    expect(result?.scores).toHaveLength(5);
    expect(result?.quality.answeredItems).toBe(40);

    await expect(
      createResultShare({
        expiresAt: new Date(Date.now() + 60_000),
        resultTokenHash: resultHash,
        shareTokenHash: shareHash,
      }),
    ).resolves.toBe(true);
    await expect(getSharedResultByHash(shareHash)).resolves.toMatchObject({
      summary: result?.summary,
    });
    await expect(
      createResultFeedback({
        message: "Membantu memahami pola",
        rating: 5,
        resultTokenHash: resultHash,
      }),
    ).resolves.toBe(true);
    await expect(revokeResultShares(resultHash)).resolves.toBe(true);
    await expect(getSharedResultByHash(shareHash)).resolves.toBeNull();
    await expect(deleteResultByHash(resultHash)).resolves.toBe(true);
    await expect(getResultByHash(resultHash)).resolves.toBeNull();
  }, 120_000);

  it("completes Standard mode with all 60 items and full item-count confidence", async () => {
    const pepper = process.env.TOKEN_HASH_PEPPER!;
    const sessionHash = hashOpaqueToken(`standard-session-${randomUUID()}`, pepper);
    const resultHash = hashOpaqueToken(`standard-result-${randomUUID()}`, pepper);
    await createAssessmentSession({
      accountId: null,
      consentVersion: "2026-07-13",
      expiresAt: new Date(Date.now() + 60_000),
      mode: "standard",
      sessionTokenHash: sessionHash,
    });
    const session = await getAssessmentSessionByHash(sessionHash);
    expect(session?.questions).toHaveLength(60);
    for (const question of session!.questions) {
      await saveAssessmentAnswer({
        idempotencyKey: randomUUID(),
        questionId: question.id,
        rawValue: 4,
        responseTimeMs: 750,
        sessionTokenHash: sessionHash,
      });
    }
    await expect(
      completeAssessment({ resultTokenHash: resultHash, sessionTokenHash: sessionHash }),
    ).resolves.toEqual({ resultId: expect.any(String) });
    const result = await getResultByHash(resultHash);
    expect(result?.scores).toHaveLength(5);
    expect(result?.quality).toMatchObject({ answeredItems: 60, confidence: 1 });
  }, 120_000);
});

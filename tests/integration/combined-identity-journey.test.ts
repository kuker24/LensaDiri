import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { identityJourneyModuleKeys } from "@/lib/assessment/identity-journey";
import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import {
  completeAssessment,
  getAssessmentSessionByHash,
  saveAssessmentAnswer,
} from "@/server/repositories/assessment";
import {
  getAvailableJourneyModuleByHash,
  getIdentityJourneyByHash,
} from "@/server/repositories/identity-journeys";
import { getJourneyResultByHash, startAssessment } from "@/server/services/assessment";

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

/** Starts one combined sitting and returns the session/journey token hashes. */
async function startCombinedJourney(overrides: { age?: number } = {}) {
  const sessionTokenHash = hashOpaqueToken(`combined-session-${randomUUID()}`, pepper);
  const journeyTokenHash = hashOpaqueToken(`combined-journey-${randomUUID()}`, pepper);
  const started = await startAssessment({
    accountId: null,
    consentVersion: "identity-journey-1",
    expiresAt: new Date(Date.now() + 120_000),
    request: {
      journey: {
        characterGender: "perempuan",
        combined: true,
        journeyTokenHash,
        kind: "create",
      },
      kind: "modular",
      locale: "id",
      selection: {
        age: overrides.age ?? 18,
        experimentalAcknowledged: true,
        mode: "deep",
        moduleKeys: [...identityJourneyModuleKeys],
        presetKey: null,
        selectionType: "custom_combo",
      },
    },
    sessionTokenHash,
  });
  return { journeyTokenHash, sessionTokenHash, started };
}

describe("combined identity journey PostgreSQL lifecycle", () => {
  it("claims all five steps with one session and stays within the Complex cap", async () => {
    const sql = getDatabase();
    const { journeyTokenHash, sessionTokenHash, started } = await startCombinedJourney();
    expect(started).toEqual({ kind: "modular", success: true });

    const session = await getAssessmentSessionByHash(sessionTokenHash);
    expect(session).not.toBeNull();
    // Complex allows at most 120 items in one session; the five-lens minimum
    // coverage is 113, so the plan has to fit without dropping a lens.
    expect(session!.questions.length).toBeLessThanOrEqual(120);

    // Every planned lens must actually contribute items, otherwise the identity
    // line could never complete.
    const moduleKeys = new Set(session!.questions.map((question) => question.moduleKey));
    for (const key of identityJourneyModuleKeys) {
      expect(moduleKeys, `${key} must contribute items to the combined sitting`).toContain(key);
    }

    const steps = await sql<{ module_key: string; session_count: number; status: string }[]>`
      select identity_journey_steps.module_key, identity_journey_steps.status,
        count(distinct identity_journey_steps.session_id)::int as session_count
      from public.identity_journey_steps
      inner join public.identity_journeys
        on identity_journeys.id = identity_journey_steps.journey_id
      where identity_journeys.journey_token_hash = ${journeyTokenHash}
      group by 1, 2
      order by 1
    `;
    expect(steps).toHaveLength(identityJourneyModuleKeys.length);
    expect(steps.every((step) => step.status === "active")).toBe(true);

    // The point of the migration: one session id shared by all five steps.
    const [shared] = await sql<{ distinct_sessions: number; step_count: number }[]>`
      select count(*)::int as step_count,
        count(distinct identity_journey_steps.session_id)::int as distinct_sessions
      from public.identity_journey_steps
      inner join public.identity_journeys
        on identity_journeys.id = identity_journey_steps.journey_id
      where identity_journeys.journey_token_hash = ${journeyTokenHash}
    `;
    expect(shared).toMatchObject({ distinct_sessions: 1, step_count: 5 });
  });

  it("completes every step at once and yields a readable, fully formed identity", async () => {
    const { journeyTokenHash, sessionTokenHash } = await startCombinedJourney();
    const session = await getAssessmentSessionByHash(sessionTokenHash);

    for (const [index, question] of session!.questions.entries()) {
      await expect(
        saveAssessmentAnswer({
          idempotencyKey: randomUUID(),
          questionId: question.id,
          rawValue: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
          responseTimeMs: 1_500,
          sessionTokenHash,
        }),
      ).resolves.toBe(true);
    }

    const resultToken = `combined-result-${randomUUID()}`;
    const resultTokenHash = hashOpaqueToken(resultToken, pepper);
    await expect(completeAssessment({ resultTokenHash, sessionTokenHash })).resolves.toMatchObject({
      resultId: expect.any(String),
    });

    const journey = await getIdentityJourneyByHash(journeyTokenHash);
    expect(journey).not.toBeNull();
    expect(journey!.steps.every((step) => step.status === "completed")).toBe(true);
    expect(journey!.complete).toBe(true);
    expect(journey!.currentPosition).toBe(identityJourneyModuleKeys.length);

    // A complete journey joins its tokens with spaces; a partial one uses "·".
    // Asserting the separator proves all five summaries really landed.
    expect(journey!.identity.line).not.toContain("·");
    expect(journey!.identity.line.split(" ").length).toBeGreaterThanOrEqual(5);
    expect(journey!.identity.type16).toMatch(/^[EI][NS][TF][JP]$/u);

    // The cutover gate only serves journey-attached results, so a combined
    // result must be reachable through it.
    const readable = await getJourneyResultByHash(resultTokenHash);
    expect(readable).not.toBeNull();
    expect(readable!.kind).toBe("modular");
    const resultModuleKeys = (readable as { modules: { moduleKey: string }[] }).modules.map(
      (module) => module.moduleKey,
    );
    for (const key of identityJourneyModuleKeys) {
      expect(resultModuleKeys).toContain(key);
    }
  });

  it("refuses a combined start below the 18+ lens minimum", async () => {
    // `psychosophy` is an 18+ module, so the whole sitting is 18+.
    const { journeyTokenHash, started } = await startCombinedJourney({ age: 17 });
    expect(started).toEqual({ code: "age_restricted", success: false });

    // A refused start must leave nothing behind.
    await expect(getIdentityJourneyByHash(journeyTokenHash)).resolves.toBeNull();
  });

  it("leaves no sequential step for the legacy continue path to resume", async () => {
    // `POST /api/journey/continue` is the pre-combined sequential entry. It only
    // serves a step in status 'available' and accepts `age >= 13`, so if a
    // combined sitting left any step 'available' it would be a way to run a
    // journey lens while bypassing the combined 18+ gate. A combined create
    // claims all five steps as 'active', which is what closes that path.
    const { journeyTokenHash } = await startCombinedJourney();

    await expect(getAvailableJourneyModuleByHash(journeyTokenHash, null)).resolves.toEqual({
      code: "journey_step_unavailable",
      success: false,
    });
  });

  /**
   * Regression: production could not start a combined sitting at all.
   *
   * The combined run is Complex, so every journey lens must ship deep-eligible
   * items. In production the Trait journey bank was copied from a `modular-1`
   * that predated the deep-mode repair, leaving all 60 items `{quick,standard}`.
   * The composer could never fill the deep quota, capacity failed closed, and
   * the entry returned `module_unavailable`.
   *
   * Asserting the item bank directly is deliberate. The lifecycle tests above
   * start a sitting successfully, yet they passed throughout the outage: seeded
   * databases build `modular-1` with `deep` already present, so no behavioural
   * test could see the production shape. This checks the data contract those
   * tests silently depend on.
   */
  it("ships deep-eligible items for every journey lens so Complex can be composed", async () => {
    const sql = getDatabase();
    const banks = await sql<{ deep_items: number; module_key: string; total_items: number }[]>`
      select modules.key as module_key,
        count(*)::int as total_items,
        count(*) filter (where 'deep' = any(questions.mode_eligibility))::int as deep_items
      from public.questions
      inner join public.module_versions
        on module_versions.id = questions.module_version_id
      inner join public.modules on modules.id = module_versions.module_id
      where module_versions.scoring_version in (
        'trait-profile-journey-1', 'enneagram-journey-score-1',
        'psychosophy-journey-score-1', 'socionics-type-score-1'
      )
      group by 1
      order by 1
    `;
    expect(banks.length).toBeGreaterThan(0);

    for (const bank of banks) {
      expect(
        bank.deep_items,
        `${bank.module_key} journey bank must be fully deep-eligible, got ${bank.deep_items}/${bank.total_items}`,
      ).toBe(bank.total_items);
    }
  });
});

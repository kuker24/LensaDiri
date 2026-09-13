import type { IndependentModuleResult } from "@/lib/scoring/modules/types";

export const identityJourneyPlan = [
  { moduleKey: "type_16", position: 1, required: true },
  { moduleKey: "enneagram", position: 2, required: false },
  { moduleKey: "socionics_communication", position: 3, required: false },
  { moduleKey: "trait_profile", position: 4, required: false },
  { moduleKey: "psychosophy", position: 5, required: false },
] as const;

export const identityJourneyModuleKeys = identityJourneyPlan.map((step) => step.moduleKey);
export type IdentityJourneyModuleKey = (typeof identityJourneyPlan)[number]["moduleKey"];

/**
 * Experimental scoring versions the journey pins for its optional lenses, plus the
 * Normal-mode item quota each of those versions actually ships.
 *
 * These values must equal `composer_config_json.standardQuota` in
 * `supabase/migrations/202609120002_identity_journey_scoring.sql`;
 * `tests/unit/identity-journey.test.ts` asserts the migration agrees.
 */
export const identityJourneyScoringVersions = {
  enneagram: "enneagram-journey-score-1",
  psychosophy: "psychosophy-journey-score-1",
  socionics_communication: "socionics-type-score-1",
  trait_profile: "trait-profile-journey-1",
} as const satisfies Readonly<Record<string, string>>;

export const identityJourneyStandardQuota = {
  enneagram: 63,
  psychosophy: 16,
  socionics_communication: 24,
  trait_profile: 60,
} as const satisfies Readonly<Record<keyof typeof identityJourneyScoringVersions, number>>;

/**
 * Complex-mode quota for the same versions, used by the combined single-sitting
 * run. Mirrors `composer_config_json.deepQuota` in the scoring migration; the
 * unit test asserts the migration agrees.
 */
export const identityJourneyDeepQuota = {
  enneagram: 72,
  psychosophy: 20,
  socionics_communication: 24,
  trait_profile: 60,
} as const satisfies Readonly<Record<keyof typeof identityJourneyScoringVersions, number>>;
export type IdentityJourneyStepStatus = "locked" | "available" | "active" | "completed";

export type IdentityJourneyStep = Readonly<{
  moduleKey: IdentityJourneyModuleKey;
  position: number;
  required: boolean;
  status: IdentityJourneyStepStatus;
}>;

export type CollectibleIdentity = Readonly<{
  complete: boolean;
  enneagram?: string;
  group?: "NT" | "NF" | "SJ" | "SP";
  line: string;
  psyche?: string;
  sloan?: string;
  socionics?: string;
  type16?: string;
}>;

export function isIdentityJourneyModuleKey(value: string): value is IdentityJourneyModuleKey {
  return identityJourneyModuleKeys.some((key) => key === value);
}

export function resolveJourneySteps(
  completedModuleKeys: readonly string[],
  activeModuleKey?: string,
): IdentityJourneyStep[] {
  const completed = new Set(completedModuleKeys);
  const firstUnfinished = identityJourneyPlan.find((step) => !completed.has(step.moduleKey));

  return identityJourneyPlan.map((step) => ({
    ...step,
    status: completed.has(step.moduleKey)
      ? "completed"
      : step.moduleKey === activeModuleKey
        ? "active"
        : step.moduleKey === firstUnfinished?.moduleKey
          ? "available"
          : "locked",
  }));
}

export function getNextJourneyModule(
  completedModuleKeys: readonly string[],
): IdentityJourneyModuleKey | null {
  return (
    identityJourneyPlan.find((step) => !completedModuleKeys.includes(step.moduleKey))?.moduleKey ??
    null
  );
}

function readSummaryString(
  module: IndependentModuleResult | undefined,
  key: string,
): string | null {
  const value = module?.summary[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function groupFromType16(value: string | null): CollectibleIdentity["group"] | undefined {
  if (!value || !/^[EI][NS][TF][JP]$/u.test(value)) return undefined;
  const middle = value.slice(1, 3);
  if (middle === "NT" || middle === "NF") return middle;
  return value.endsWith("J") ? "SJ" : "SP";
}

export function buildCollectibleIdentity(
  modules: readonly IndependentModuleResult[],
): CollectibleIdentity {
  const byKey = new Map(modules.map((module) => [module.moduleKey, module]));
  const type16 = readSummaryString(byKey.get("type_16"), "primaryType");
  const enneagram = readSummaryString(byKey.get("enneagram"), "compactCode");
  const socionics = readSummaryString(byKey.get("socionics_communication"), "primaryType");
  const sloan = readSummaryString(byKey.get("trait_profile"), "sloanCode");
  const psyche = readSummaryString(byKey.get("psychosophy"), "positionCode");
  const group = groupFromType16(type16);
  const complete = identityJourneyModuleKeys.every((key) => byKey.has(key));
  const parts = [type16, enneagram, socionics, sloan, psyche, group].filter(
    (part): part is string => Boolean(part),
  );

  return {
    complete,
    ...(enneagram ? { enneagram } : {}),
    ...(group ? { group } : {}),
    line: parts.join(complete ? " " : " · "),
    ...(psyche ? { psyche } : {}),
    ...(sloan ? { sloan } : {}),
    ...(socionics ? { socionics } : {}),
    ...(type16 ? { type16 } : {}),
  };
}

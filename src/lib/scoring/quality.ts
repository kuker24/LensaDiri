import type { AssessmentMode } from "@/lib/assessment/catalog";
import { reverseLikert, type ItemPolarity, type LikertValue } from "@/lib/scoring/likert";

export const qualityFlagKeys = [
  "incomplete",
  "too_fast",
  "straightlining",
  "low_variance",
  "reverse_inconsistency",
  "inconsistent_pair",
  "threshold_ambiguity",
  "clarifier_recommended",
  "low_module_coverage",
  "excessive_midpoint",
] as const;
export type QualityFlag = (typeof qualityFlagKeys)[number];

export const qualityModelVersions = ["module-quality-1", "module-quality-2"] as const;
export type QualityModelVersion = (typeof qualityModelVersions)[number];

export function isQualityModelVersion(value: unknown): value is QualityModelVersion {
  return typeof value === "string" && (qualityModelVersions as readonly string[]).includes(value);
}

/**
 * Version-aware confidence dispatch (PRD §15.4). A result reader must resolve
 * the stored `qualityModelVersion` through this function: an absent value maps
 * to the legacy `module-quality-1` (old rows predate the field), a known value
 * passes through, and any unknown non-null value fails closed. Read paths never
 * recompute confidence, so replay stays deterministic.
 */
export function resolveQualityModelVersion(value: unknown): QualityModelVersion {
  if (value === null || value === undefined) return "module-quality-1";
  if (isQualityModelVersion(value)) return value;
  throw new RangeError(`Unknown quality model version: ${String(value)}.`);
}

export interface ModuleScoringAnswer<ConstructKey extends string = string> {
  readonly constructKey: ConstructKey;
  readonly itemCode: string;
  readonly polarity: ItemPolarity;
  readonly responseTimeMs: number | null;
  readonly value: LikertValue;
  readonly weight: number;
}

/**
 * Versioned confidence inputs (PRD §15.4, `module-quality-2`). Every field is
 * optional and server-authoritative; `module-quality-1` ignores all of them so
 * legacy callers and stored results keep byte-identical numbers.
 */
export interface QualityModelContext {
  /** Clarifier resolution for this module. `completed` lifts, `skipped` lowers. */
  readonly clarifier?: "completed" | "skipped" | "none";
  /** Mean server-authoritative item weight; only scales when it drops below 1. */
  readonly itemQualityWeight?: number;
  /** Deterministic depth factor: Quick < Normal < Complex. */
  readonly modeDepth?: AssessmentMode;
  /** Optional-item coverage; only active when the module has optional items. */
  readonly optionalItems?: { readonly answered: number; readonly expected: number };
  /** Selected confidence formula. Absent defaults to the legacy model. */
  readonly qualityModelVersion?: QualityModelVersion;
}

/**
 * Named `module-quality-2` coefficients (PRD §15.4). Bounded and additive; no
 * single factor guarantees high confidence because the final value is clamped
 * to [0, 1]. Every coefficient is exercised by a directional unit test.
 */
const qualityModel2 = {
  /** Depth bonus per mode. Complex answers more items, so it earns more. */
  modeDepthBonus: { deep: 0.06, quick: 0, standard: 0.03 } as const,
  /** Confidence gained when a recommended clarifier is completed. */
  clarifierCompletedBonus: 0.04,
  /** Confidence lost when a recommended clarifier is skipped. */
  clarifierSkippedPenalty: 0.05,
  /** Max penalty applied to fully skipped optional items. */
  optionalSkipPenalty: 0.08,
  /** Max penalty applied when mean item weight falls to zero. */
  lowWeightPenalty: 0.1,
} as const;

export interface ModuleQuality {
  readonly averageResponseTimeMs: number | null;
  readonly completion: number;
  readonly confidence: number;
  readonly contradictionRate: number;
  readonly flags: readonly QualityFlag[];
  readonly midpointRate: number;
  readonly qualityModelVersion: QualityModelVersion;
  readonly responseVariance: number;
  readonly uniqueResponses: number;
}

function variance(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

/**
 * Contradiction-pair detection (PRD §15.4). For each construct that has both a
 * forward (polarity 1) and a reverse (polarity -1) item, both directions should
 * point the same way once reverse coding is applied. A wide gap between the
 * reverse-coded forward mean and reverse-coded reverse mean signals an
 * inconsistent pair. Returns the fraction of eligible constructs that diverge.
 */
function contradictionRate(answers: readonly ModuleScoringAnswer[]): number {
  const byConstruct = new Map<string, { readonly forward: number[]; readonly reverse: number[] }>();
  for (const answer of answers) {
    const bucket = byConstruct.get(answer.constructKey) ?? { forward: [], reverse: [] };
    const coded = answer.polarity === -1 ? reverseLikert(answer.value) : answer.value;
    if (answer.polarity === -1) bucket.reverse.push(coded);
    else bucket.forward.push(coded);
    byConstruct.set(answer.constructKey, bucket);
  }

  const eligible = [...byConstruct.values()].filter(
    (bucket) => bucket.forward.length > 0 && bucket.reverse.length > 0,
  );
  if (eligible.length === 0) return 0;

  const mean = (values: readonly number[]): number =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const contradictory = eligible.filter(
    (bucket) => Math.abs(mean(bucket.forward) - mean(bucket.reverse)) > 1.5,
  ).length;
  return Number((contradictory / eligible.length).toFixed(4));
}

/**
 * Versioned confidence contribution (PRD §15.4). Returns the net delta applied
 * on top of the shared `module-quality-1` base. `module-quality-1` returns 0 so
 * its confidence is unchanged; `module-quality-2` folds in the four additional
 * factors, each bounded and directional.
 */
function versionedConfidenceDelta(
  version: QualityModelVersion,
  context: QualityModelContext,
  answers: readonly ModuleScoringAnswer[],
): number {
  if (version === "module-quality-1") return 0;

  let delta = 0;

  // Skipped optional items only matter when the module actually has optionals.
  const optional = context.optionalItems;
  if (optional && optional.expected > 0) {
    const answered = Math.max(0, Math.min(optional.answered, optional.expected));
    const skippedFraction = (optional.expected - answered) / optional.expected;
    delta -= skippedFraction * qualityModel2.optionalSkipPenalty;
  }

  // Clarifier completion lifts confidence; a skip lowers it. `none` is neutral.
  if (context.clarifier === "completed") delta += qualityModel2.clarifierCompletedBonus;
  else if (context.clarifier === "skipped") delta -= qualityModel2.clarifierSkippedPenalty;

  // Item quality weight is server-authoritative; below 1 it scales confidence down.
  const weight =
    context.itemQualityWeight ??
    (answers.length === 0
      ? 1
      : answers.reduce((sum, answer) => sum + answer.weight, 0) / answers.length);
  const boundedWeight = Math.max(0, Math.min(1, weight));
  delta -= (1 - boundedWeight) * qualityModel2.lowWeightPenalty;

  // Deterministic depth: Complex sessions answer more items than Quick.
  if (context.modeDepth) delta += qualityModel2.modeDepthBonus[context.modeDepth];

  return delta;
}

export function assessModuleQuality(input: {
  readonly ambiguity: number;
  readonly answers: readonly ModuleScoringAnswer[];
  readonly context?: QualityModelContext | undefined;
  readonly dimensionCoverage: number;
  readonly expectedAnswers: number;
  readonly reverseConsistency: number;
}): ModuleQuality {
  if (!Number.isInteger(input.expectedAnswers) || input.expectedAnswers <= 0) {
    throw new RangeError("Expected answer count must be positive.");
  }
  const context = input.context ?? {};
  const modelVersion = context.qualityModelVersion ?? "module-quality-1";
  const values = input.answers.map((answer) => answer.value);
  const completion = Math.min(1, input.answers.length / input.expectedAnswers);
  const uniqueResponses = new Set(values).size;
  const responseVariance = variance(values);
  const midpointRate =
    values.length === 0 ? 0 : values.filter((value) => value === 3).length / values.length;
  const timed = input.answers
    .map((answer) => answer.responseTimeMs)
    .filter((time): time is number => time !== null);
  const averageResponseTimeMs =
    timed.length === 0 ? null : timed.reduce((sum, time) => sum + time, 0) / timed.length;
  const pairContradiction = contradictionRate(input.answers);

  const flags = new Set<QualityFlag>();
  if (completion < 1) flags.add("incomplete");
  if (completion < 0.8 || input.dimensionCoverage < 0.8) flags.add("low_module_coverage");
  if (averageResponseTimeMs !== null && averageResponseTimeMs < 900) flags.add("too_fast");
  if (values.length >= 8 && uniqueResponses === 1) flags.add("straightlining");
  if (values.length >= 8 && responseVariance < 0.35) flags.add("low_variance");
  if (input.reverseConsistency < 0.65) flags.add("reverse_inconsistency");
  if (pairContradiction > 0) flags.add("inconsistent_pair");
  if (input.ambiguity >= 0.7) flags.add("threshold_ambiguity");
  if (midpointRate > 0.55) flags.add("excessive_midpoint");
  if (
    flags.has("threshold_ambiguity") ||
    flags.has("reverse_inconsistency") ||
    flags.has("inconsistent_pair") ||
    flags.has("low_module_coverage")
  ) {
    flags.add("clarifier_recommended");
  }

  const penalty =
    (flags.has("too_fast") ? 0.12 : 0) +
    (flags.has("straightlining") ? 0.3 : 0) +
    (flags.has("low_variance") ? 0.1 : 0) +
    (flags.has("reverse_inconsistency") ? 0.15 : 0) +
    (flags.has("inconsistent_pair") ? pairContradiction * 0.15 : 0) +
    (flags.has("threshold_ambiguity") ? 0.12 : 0) +
    (flags.has("excessive_midpoint") ? 0.08 : 0);
  const baseConfidence =
    completion * 0.35 +
    Math.min(1, input.dimensionCoverage) * 0.25 +
    Math.min(1, input.reverseConsistency) * 0.2 +
    Math.max(0, 1 - input.ambiguity) * 0.2 -
    penalty;
  const versionedDelta = versionedConfidenceDelta(modelVersion, context, input.answers);
  const confidence = Number(Math.max(0, Math.min(1, baseConfidence + versionedDelta)).toFixed(4));

  return {
    averageResponseTimeMs:
      averageResponseTimeMs === null ? null : Math.round(averageResponseTimeMs),
    completion: Number(completion.toFixed(4)),
    confidence,
    contradictionRate: pairContradiction,
    flags: [...flags].toSorted(),
    midpointRate: Number(midpointRate.toFixed(4)),
    qualityModelVersion: modelVersion,
    responseVariance: Number(responseVariance.toFixed(4)),
    uniqueResponses,
  };
}

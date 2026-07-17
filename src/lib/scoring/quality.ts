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

export interface ModuleScoringAnswer<ConstructKey extends string = string> {
  readonly constructKey: ConstructKey;
  readonly itemCode: string;
  readonly polarity: ItemPolarity;
  readonly responseTimeMs: number | null;
  readonly value: LikertValue;
  readonly weight: number;
}

export interface ModuleQuality {
  readonly averageResponseTimeMs: number | null;
  readonly completion: number;
  readonly confidence: number;
  readonly contradictionRate: number;
  readonly flags: readonly QualityFlag[];
  readonly midpointRate: number;
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

export function assessModuleQuality(input: {
  readonly ambiguity: number;
  readonly answers: readonly ModuleScoringAnswer[];
  readonly dimensionCoverage: number;
  readonly expectedAnswers: number;
  readonly reverseConsistency: number;
}): ModuleQuality {
  if (!Number.isInteger(input.expectedAnswers) || input.expectedAnswers <= 0) {
    throw new RangeError("Expected answer count must be positive.");
  }
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
  const confidence = Number(
    Math.max(
      0,
      Math.min(
        1,
        completion * 0.35 +
          Math.min(1, input.dimensionCoverage) * 0.25 +
          Math.min(1, input.reverseConsistency) * 0.2 +
          Math.max(0, 1 - input.ambiguity) * 0.2 -
          penalty,
      ),
    ).toFixed(4),
  );

  return {
    averageResponseTimeMs:
      averageResponseTimeMs === null ? null : Math.round(averageResponseTimeMs),
    completion: Number(completion.toFixed(4)),
    confidence,
    contradictionRate: pairContradiction,
    flags: [...flags].toSorted(),
    midpointRate: Number(midpointRate.toFixed(4)),
    responseVariance: Number(responseVariance.toFixed(4)),
    uniqueResponses,
  };
}

import { scoreWeightedLikert } from "@/lib/scoring/likert";
import {
  assessModuleQuality,
  type ModuleQuality,
  type ModuleScoringAnswer,
  type QualityModelContext,
} from "@/lib/scoring/quality";

export interface ModuleDimensionScore<ConstructKey extends string = string> {
  readonly confidence: number;
  readonly constructKey: ConstructKey;
  readonly facetKey: string;
  readonly normalizedScore: number;
  readonly rawScore: number;
}

export interface IndependentModuleResult<
  ModuleKey extends string = string,
  ConstructKey extends string = string,
> {
  readonly ambiguity: Readonly<Record<string, unknown>>;
  readonly confidence: number;
  readonly evidenceTier: "A" | "B" | "B_EXPERIMENTAL" | "EXPERIMENTAL" | "C";
  readonly moduleKey: ModuleKey;
  readonly quality: ModuleQuality;
  readonly scores: readonly ModuleDimensionScore<ConstructKey>[];
  readonly scoringVersion: string;
  readonly summary: Readonly<Record<string, unknown>>;
}

export function scoreConstructs<ConstructKey extends string>(
  answers: readonly ModuleScoringAnswer<ConstructKey>[],
  constructKeys: readonly ConstructKey[],
): readonly ModuleDimensionScore<ConstructKey>[] {
  return constructKeys.map((constructKey) => {
    const responses = answers.filter((answer) => answer.constructKey === constructKey);
    if (responses.length === 0) throw new RangeError(`Missing responses for ${constructKey}.`);
    const scored = scoreWeightedLikert(responses);
    return {
      confidence: Number(Math.min(1, responses.length / 6).toFixed(4)),
      constructKey,
      facetKey: "general",
      normalizedScore: scored.normalizedScore,
      rawScore: scored.weightedAverage,
    };
  });
}

export function getScoreGap(
  scores: readonly ModuleDimensionScore[],
): Readonly<{ ambiguity: number; gap: number }> {
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const gap = Math.abs((ordered[0]?.normalizedScore ?? 0) - (ordered[1]?.normalizedScore ?? 0));
  return { ambiguity: Number(Math.max(0, 1 - gap / 25).toFixed(4)), gap };
}

export function getBoundaryAmbiguity(
  scores: readonly ModuleDimensionScore[],
  boundary = 50,
): number {
  const closest = Math.min(...scores.map((score) => Math.abs(score.normalizedScore - boundary)));
  return Number(Math.max(0, 1 - closest / 20).toFixed(4));
}

export function scoreQuality<ConstructKey extends string>(input: {
  ambiguity: number;
  answers: readonly ModuleScoringAnswer<ConstructKey>[];
  constructKeys: readonly ConstructKey[];
  context?: QualityModelContext | undefined;
  expectedAnswers: number;
}): ModuleQuality {
  const covered = new Set(input.answers.map((answer) => answer.constructKey)).size;
  const reverseAnswers = input.answers.filter((answer) => answer.polarity === -1);
  const reverseConsistency =
    reverseAnswers.length === 0
      ? 1
      : reverseAnswers.filter((answer) => answer.value !== 3).length / reverseAnswers.length;
  return assessModuleQuality({
    ambiguity: input.ambiguity,
    answers: input.answers,
    context: input.context,
    dimensionCoverage: covered / input.constructKeys.length,
    expectedAnswers: input.expectedAnswers,
    reverseConsistency,
  });
}

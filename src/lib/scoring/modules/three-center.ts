import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  getScoreGap,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const threeCenterConstructKeys = ["head", "heart", "gut"] as const;
export type ThreeCenterConstructKey = (typeof threeCenterConstructKeys)[number];

export function scoreThreeCenterModule(
  answers: readonly ModuleScoringAnswer<ThreeCenterConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"three_center", ThreeCenterConstructKey> {
  const scores = scoreConstructs(answers, threeCenterConstructKeys);
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const { ambiguity, gap } = getScoreGap(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: threeCenterConstructKeys,
    context,
    expectedAnswers,
  });
  return {
    ambiguity: {
      gap: Number(gap.toFixed(2)),
      level: ambiguity,
    },
    confidence: quality.confidence,
    evidenceTier: "B",
    moduleKey: "three_center",
    quality,
    scores,
    scoringVersion: "three-center-score-1",
    summary: {
      disclaimer: "Three-Center Pattern untuk refleksi; bukan instrumen resmi atau diagnosis.",
      primaryCenter: ordered[0]?.constructKey ?? null,
    },
  };
}

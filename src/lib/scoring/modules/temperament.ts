import type { ModuleScoringAnswer } from "@/lib/scoring/quality";
import {
  getScoreGap,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const temperamentConstructKeys = [
  "sanguine",
  "choleric",
  "melancholic",
  "phlegmatic",
] as const;
export type TemperamentConstructKey = (typeof temperamentConstructKeys)[number];

export function scoreTemperamentModule(
  answers: readonly ModuleScoringAnswer<TemperamentConstructKey>[],
  expectedAnswers: number,
): IndependentModuleResult<"temperament", TemperamentConstructKey> {
  const scores = scoreConstructs(answers, temperamentConstructKeys);
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const { ambiguity, gap } = getScoreGap(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: temperamentConstructKeys,
    expectedAnswers,
  });
  return {
    ambiguity: {
      gap: Number(gap.toFixed(2)),
      level: ambiguity,
      secondaryClose: gap < 10,
    },
    confidence: quality.confidence,
    evidenceTier: "B",
    moduleKey: "temperament",
    quality,
    scores,
    scoringVersion: "temperament-score-1",
    summary: {
      disclaimer: "Lensa temperamen untuk refleksi; bukan kategori biologis atau diagnosis.",
      primary: ordered[0]?.constructKey ?? null,
      secondary: ordered[1]?.constructKey ?? null,
    },
  };
}

import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  getScoreGap,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const instinctConstructKeys = ["self_preservation", "social", "one_to_one"] as const;
export type InstinctConstructKey = (typeof instinctConstructKeys)[number];

export function scoreInstinctModule(
  answers: readonly ModuleScoringAnswer<InstinctConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"instinct", InstinctConstructKey> {
  const scores = scoreConstructs(answers, instinctConstructKeys);
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const { ambiguity, gap } = getScoreGap(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: instinctConstructKeys,
    context,
    expectedAnswers,
  });
  return {
    ambiguity: {
      alternateVariant: ordered[1]?.constructKey ?? null,
      gap: Number(gap.toFixed(2)),
      level: ambiguity,
    },
    confidence: quality.confidence,
    evidenceTier: "B",
    moduleKey: "instinct",
    quality,
    scores,
    scoringVersion: "instinct-score-1",
    summary: {
      disclaimer:
        "Instinctual Variant Lens untuk refleksi; standalone tetapi lebih bermakna bila dikombinasikan dengan Enneagram.",
      primaryVariant: ordered[0]?.constructKey ?? null,
    },
  };
}

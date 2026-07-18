import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const psychosophyConstructKeys = ["emotion", "will", "logic", "physics"] as const;
export type PsychosophyConstructKey = (typeof psychosophyConstructKeys)[number];

export function scorePsychosophyModule(
  answers: readonly ModuleScoringAnswer<PsychosophyConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"psychosophy", PsychosophyConstructKey> {
  const scores = scoreConstructs(answers, psychosophyConstructKeys);
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const quality = scoreQuality({
    ambiguity: 0,
    answers,
    constructKeys: psychosophyConstructKeys,
    context,
    expectedAnswers,
  });
  return {
    ambiguity: {},
    confidence: quality.confidence,
    evidenceTier: "EXPERIMENTAL",
    moduleKey: "psychosophy",
    quality,
    scores,
    scoringVersion: "psychosophy-score-1",
    summary: {
      disclaimer:
        "Psychosophy Experimental Lens hanya untuk refleksi eksploratif dan tidak masuk ringkasan evidence-oriented.",
      priorityOrder: ordered.map((score) => score.constructKey),
    },
  };
}

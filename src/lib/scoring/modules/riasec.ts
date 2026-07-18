import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const riasecConstructKeys = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
] as const;
export type RiasecConstructKey = (typeof riasecConstructKeys)[number];

export function scoreRiasecModule(
  answers: readonly ModuleScoringAnswer<RiasecConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"riasec", RiasecConstructKey> {
  const scores = scoreConstructs(answers, riasecConstructKeys);
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const top3 = ordered.slice(0, 3).map((score) => score.constructKey);
  const quality = scoreQuality({
    ambiguity: 0,
    answers,
    constructKeys: riasecConstructKeys,
    context,
    expectedAnswers,
  });
  return {
    ambiguity: {},
    confidence: quality.confidence,
    evidenceTier: "B",
    moduleKey: "riasec",
    quality,
    scores,
    scoringVersion: "riasec-score-1",
    summary: {
      disclaimer: "RIASEC Career Interest Lens menggambarkan minat, bukan penentu karier mutlak.",
      hollandCode: top3.map((key) => key.charAt(0).toUpperCase()).join(""),
      topInterests: top3,
    },
  };
}

import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  getBoundaryAmbiguity,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const socionicsConstructKeys = ["information_processing", "interaction_style"] as const;
export type SocionicsConstructKey = (typeof socionicsConstructKeys)[number];

const styleLabels: Readonly<Record<SocionicsConstructKey, readonly [string, string]>> = {
  information_processing: ["konkret-berurutan", "abstrak-asosiatif"],
  interaction_style: ["responsif", "menginisiasi"],
};

export function scoreSocionicsModule(
  answers: readonly ModuleScoringAnswer<SocionicsConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"socionics_communication", SocionicsConstructKey> {
  const scores = scoreConstructs(answers, socionicsConstructKeys);
  const ambiguity = getBoundaryAmbiguity(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: socionicsConstructKeys,
    context,
    expectedAnswers,
  });
  const pattern = socionicsConstructKeys
    .map((key) => {
      const score = scores.find((candidate) => candidate.constructKey === key);
      const value = score?.normalizedScore ?? 50;
      return value >= 50 ? styleLabels[key][1] : styleLabels[key][0];
    })
    .join(" · ");
  return {
    ambiguity: {
      level: ambiguity,
    },
    confidence: quality.confidence,
    evidenceTier: "B_EXPERIMENTAL",
    moduleKey: "socionics_communication",
    quality,
    scores,
    scoringVersion: "socionics-score-1",
    summary: {
      communicationPattern: pattern,
      disclaimer:
        "Socionics-inspired Communication Lens bersifat eksperimental dan bukan Socionics resmi.",
    },
  };
}

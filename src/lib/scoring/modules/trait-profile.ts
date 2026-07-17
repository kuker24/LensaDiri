import {
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";
import { traitKeys, type TraitKey } from "@/lib/scoring/profile";
import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";

const traitLabels: Readonly<Record<TraitKey, string>> = {
  agreeableness: "kooperatif",
  conscientiousness: "terarah",
  emotional_sensitivity: "peka",
  extraversion: "ekspresif",
  openness: "eksploratif",
};

export function scoreTraitProfileModule(
  answers: readonly ModuleScoringAnswer<TraitKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"trait_profile", TraitKey> {
  const scores = scoreConstructs(answers, traitKeys);
  const quality = scoreQuality({
    ambiguity: 0,
    answers,
    constructKeys: traitKeys,
    context,
    expectedAnswers,
  });
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const strongest = ordered.slice(0, 2);
  return {
    ambiguity: {},
    confidence: quality.confidence,
    evidenceTier: "A",
    moduleKey: "trait_profile",
    quality,
    scores,
    scoringVersion: "trait-profile-modular-1",
    summary: {
      archetype: strongest.map((score) => traitLabels[score.constructKey]).join(" dan "),
      disclaimer:
        "Profil Trait adalah lensa refleksi berbasis jawaban, bukan diagnosis atau batas kepribadian.",
      strongestTraits: strongest.map((score) => score.constructKey),
    },
  };
}

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

/**
 * The Sloan code is positional: one letter per trait, always in this order, with
 * the pair given as `[below 50, at or above 50]`.
 *
 * Exported because the result report explains where each letter came from. The
 * legend walks this list rather than restating the order and the pairs, so the
 * explanation cannot drift from the code it explains.
 */
export const sloanLetterOrder = [
  { constructKey: "extraversion", letters: ["R", "S"] },
  { constructKey: "emotional_sensitivity", letters: ["C", "L"] },
  { constructKey: "conscientiousness", letters: ["U", "O"] },
  { constructKey: "agreeableness", letters: ["E", "A"] },
  { constructKey: "openness", letters: ["N", "I"] },
] as const satisfies readonly {
  constructKey: TraitKey;
  letters: readonly [string, string];
}[];

function resolveSloanCode(scores: readonly { constructKey: TraitKey; normalizedScore: number }[]) {
  return sloanLetterOrder
    .map((entry) => {
      const score = scores.find((candidate) => candidate.constructKey === entry.constructKey);
      return (score?.normalizedScore ?? 50) >= 50 ? entry.letters[1] : entry.letters[0];
    })
    .join("");
}

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

export function scoreTraitProfileJourneyModule(
  answers: readonly ModuleScoringAnswer<TraitKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"trait_profile", TraitKey> {
  const base = scoreTraitProfileModule(answers, expectedAnswers, context);
  return {
    ...base,
    scoringVersion: "trait-profile-journey-1",
    summary: { ...base.summary, sloanCode: resolveSloanCode(base.scores) },
  };
}

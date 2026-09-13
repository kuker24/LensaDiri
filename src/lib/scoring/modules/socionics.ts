import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  getBoundaryAmbiguity,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const socionicsConstructKeys = ["information_processing", "interaction_style"] as const;
export type SocionicsConstructKey = (typeof socionicsConstructKeys)[number];

export const socionicsTypeConstructKeys = [
  "extraversion",
  "intuition",
  "logic",
  "rationality",
] as const;
export type SocionicsTypeConstructKey = (typeof socionicsTypeConstructKeys)[number];

const styleLabels: Readonly<Record<SocionicsConstructKey, readonly [string, string]>> = {
  information_processing: ["konkret-berurutan", "abstrak-asosiatif"],
  interaction_style: ["responsif", "menginisiasi"],
};

/**
 * Letter pairs for the three constructs that print a letter, each given as
 * `[below 50, at or above 50]`.
 *
 * `rationality` is deliberately absent: it prints no letter of its own. It only
 * decides whether the judgment letter or the perception letter comes first, which
 * is why the same three letters can appear in two different orders. The result
 * report explains this, and reads this map rather than restating it.
 */
export const socionicsLetters = {
  extraversion: ["I", "E"],
  intuition: ["S", "I"],
  logic: ["E", "L"],
} as const satisfies Readonly<Record<string, readonly [string, string]>>;

/**
 * Construct keys in printed order for a given `rationality` reading.
 *
 * Rational codes lead with judgment, irrational codes lead with perception; the
 * orientation letter is always last.
 */
export function socionicsSlotOrder(
  isRational: boolean,
): readonly ["intuition" | "logic", "intuition" | "logic", "extraversion"] {
  return isRational
    ? ["logic", "intuition", "extraversion"]
    : ["intuition", "logic", "extraversion"];
}

function resolveSocionicsType(values: Readonly<Record<SocionicsTypeConstructKey, number>>): string {
  return socionicsSlotOrder(values.rationality >= 50)
    .map((key) => (values[key] >= 50 ? socionicsLetters[key][1] : socionicsLetters[key][0]))
    .join("");
}

export function scoreSocionicsTypeModule(
  answers: readonly ModuleScoringAnswer<SocionicsTypeConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"socionics_communication", SocionicsTypeConstructKey> {
  const scores = scoreConstructs(answers, socionicsTypeConstructKeys);
  const values = Object.fromEntries(
    scores.map((score) => [score.constructKey, score.normalizedScore]),
  ) as Record<SocionicsTypeConstructKey, number>;
  const primaryType = resolveSocionicsType(values);
  const boundary = scores.toSorted(
    (left, right) => Math.abs(left.normalizedScore - 50) - Math.abs(right.normalizedScore - 50),
  )[0];
  const alternateType = boundary
    ? resolveSocionicsType({ ...values, [boundary.constructKey]: 100 - boundary.normalizedScore })
    : null;
  const ambiguity = getBoundaryAmbiguity(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: socionicsTypeConstructKeys,
    context,
    expectedAnswers,
  });
  return {
    ambiguity: {
      alternateType,
      boundaryDimension: boundary?.constructKey ?? null,
      level: ambiguity,
    },
    confidence: quality.confidence,
    evidenceTier: "B_EXPERIMENTAL",
    moduleKey: "socionics_communication",
    quality,
    scores,
    scoringVersion: "socionics-type-score-1",
    summary: {
      disclaimer:
        "Kode Socionics-inspired bersifat eksperimental untuk refleksi komunikasi; bukan Socionics resmi.",
      primaryType,
    },
  };
}

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

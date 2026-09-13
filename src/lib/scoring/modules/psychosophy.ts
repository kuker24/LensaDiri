import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const psychosophyConstructKeys = ["emotion", "will", "logic", "physics"] as const;
export type PsychosophyConstructKey = (typeof psychosophyConstructKeys)[number];

/**
 * One letter per aspect. Unlike the other lenses this code carries no threshold:
 * the four aspects are ranked against each other and the superscript is the rank.
 *
 * Both maps are exported because the result report explains how the code was
 * built, and reading them beats restating them in the explanation.
 */
export const psychosophyPositionLetters: Readonly<Record<PsychosophyConstructKey, string>> = {
  emotion: "E",
  will: "V",
  logic: "L",
  physics: "F",
};

export const psychosophySuperscripts = ["¹", "²", "³", "⁴"] as const;

const positionLetters = psychosophyPositionLetters;

const superscripts = psychosophySuperscripts;

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

export function scorePsychosophyJourneyModule(
  answers: readonly ModuleScoringAnswer<PsychosophyConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"psychosophy", PsychosophyConstructKey> {
  const base = scorePsychosophyModule(answers, expectedAnswers, context);
  const order = base.summary.priorityOrder;
  if (!Array.isArray(order) || order.length !== psychosophyConstructKeys.length) {
    throw new RangeError("Psychosophy journey result requires four ordered aspects.");
  }
  const positionCode = order
    .map((key, index) => {
      if (typeof key !== "string" || !(key in positionLetters)) {
        throw new RangeError("Psychosophy journey result contains an unknown aspect.");
      }
      return `${positionLetters[key as PsychosophyConstructKey]}${superscripts[index]}`;
    })
    .join("");
  return {
    ...base,
    scoringVersion: "psychosophy-journey-score-1",
    summary: { ...base.summary, positionCode },
  };
}

import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  getScoreGap,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const enneagramConstructKeys = [
  "pattern_1",
  "pattern_2",
  "pattern_3",
  "pattern_4",
  "pattern_5",
  "pattern_6",
  "pattern_7",
  "pattern_8",
  "pattern_9",
] as const;
export type EnneagramConstructKey = (typeof enneagramConstructKeys)[number];

export const enneagramJourneyConstructKeys = [
  ...enneagramConstructKeys,
  "instinct_self_preservation",
  "instinct_social",
  "instinct_one_to_one",
] as const;
export type EnneagramJourneyConstructKey = (typeof enneagramJourneyConstructKeys)[number];

/**
 * Which of the three centres each pattern belongs to.
 *
 * Exported with `enneagramInstinctCodes` below because the result report explains
 * how the compact code was assembled: the instinct prefix, then the top pattern,
 * then the top pattern of each remaining centre. The legend reads these maps
 * instead of restating them.
 */
export const enneagramCenters: Readonly<Record<EnneagramConstructKey, "gut" | "heart" | "head">> = {
  pattern_1: "gut",
  pattern_2: "heart",
  pattern_3: "heart",
  pattern_4: "heart",
  pattern_5: "head",
  pattern_6: "head",
  pattern_7: "head",
  pattern_8: "gut",
  pattern_9: "gut",
};

const centers = enneagramCenters;

function patternNumber(key: EnneagramConstructKey): number {
  return Number(key.slice("pattern_".length));
}

/** Instinct prefix of the compact code, one per instinct construct. */
export const enneagramInstinctCodes = {
  instinct_one_to_one: "sx",
  instinct_self_preservation: "sp",
  instinct_social: "so",
} as const;

const instinctCodes = enneagramInstinctCodes;

export function scoreEnneagramJourneyModule(
  answers: readonly ModuleScoringAnswer<EnneagramJourneyConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"enneagram", EnneagramJourneyConstructKey> {
  const scores = scoreConstructs(answers, enneagramJourneyConstructKeys);
  const patternScores = scores
    .filter((score): score is typeof score & { constructKey: EnneagramConstructKey } =>
      enneagramConstructKeys.includes(score.constructKey as EnneagramConstructKey),
    )
    .toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const core = patternScores[0];
  if (!core) throw new RangeError("Enneagram journey result requires pattern scores.");
  const coreCenter = centers[core.constructKey];
  const centerWinners = (["gut", "heart", "head"] as const)
    .map(
      (center) =>
        patternScores
          .filter((score) => centers[score.constructKey] === center)
          .toSorted((left, right) => right.normalizedScore - left.normalizedScore)[0],
    )
    .filter((score): score is NonNullable<typeof score> => Boolean(score));
  const remaining = centerWinners
    .filter((score) => centers[score.constructKey] !== coreCenter)
    .toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const tritype = [core, ...remaining].map((score) => patternNumber(score.constructKey)).join("");
  const instinct = scores
    .filter((score) => score.constructKey.startsWith("instinct_"))
    .toSorted((left, right) => right.normalizedScore - left.normalizedScore)[0];
  if (!instinct || !(instinct.constructKey in instinctCodes)) {
    throw new RangeError("Enneagram journey result requires instinct scores.");
  }
  const { ambiguity, gap } = getScoreGap(patternScores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: enneagramJourneyConstructKeys,
    context,
    expectedAnswers,
  });
  const instinctCode = instinctCodes[instinct.constructKey as keyof typeof instinctCodes];
  return {
    ambiguity: { alternatePattern: patternScores[1]?.constructKey ?? null, gap, level: ambiguity },
    confidence: quality.confidence,
    evidenceTier: "B",
    moduleKey: "enneagram",
    quality,
    scores,
    scoringVersion: "enneagram-journey-score-1",
    summary: {
      compactCode: `${instinctCode}${tritype}`,
      corePattern: core.constructKey,
      disclaimer:
        "Kode gabungan Enneagram, tiga pusat, dan insting bersifat eksperimental untuk refleksi; bukan diagnosis.",
      instinct: instinctCode,
      tritype,
    },
  };
}

export function scoreEnneagramModule(
  answers: readonly ModuleScoringAnswer<EnneagramConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"enneagram", EnneagramConstructKey> {
  const scores = scoreConstructs(answers, enneagramConstructKeys);
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const core = ordered[0];
  if (!core) throw new RangeError("Enneagram result requires scores.");
  const coreNumber = patternNumber(core.constructKey);
  const wingNumbers = [
    coreNumber === 1 ? 9 : coreNumber - 1,
    coreNumber === 9 ? 1 : coreNumber + 1,
  ];
  const wing = ordered
    .filter((score) => wingNumbers.includes(patternNumber(score.constructKey)))
    .toSorted((left, right) => right.normalizedScore - left.normalizedScore)[0];
  const { ambiguity, gap } = getScoreGap(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: enneagramConstructKeys,
    context,
    expectedAnswers,
  });
  return {
    ambiguity: {
      alternatePattern: ordered[1]?.constructKey ?? null,
      gap: Number(gap.toFixed(2)),
      level: ambiguity,
    },
    confidence: quality.confidence,
    evidenceTier: "B",
    moduleKey: "enneagram",
    quality,
    scores,
    scoringVersion: "enneagram-score-1",
    summary: {
      center: centers[core.constructKey],
      corePattern: core.constructKey,
      disclaimer: "Lensa motivasi Enneagram-inspired; bukan instrumen resmi atau diagnosis.",
      wing: wing?.constructKey ?? null,
    },
  };
}

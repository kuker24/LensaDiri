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

const centers: Readonly<Record<EnneagramConstructKey, "gut" | "heart" | "head">> = {
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

function patternNumber(key: EnneagramConstructKey): number {
  return Number(key.slice("pattern_".length));
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

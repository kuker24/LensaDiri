import type { ModuleScoringAnswer } from "@/lib/scoring/quality";
import {
  getBoundaryAmbiguity,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const type16ConstructKeys = ["extraversion", "intuition", "feeling", "judging"] as const;
export type Type16ConstructKey = (typeof type16ConstructKeys)[number];

const letters: Readonly<Record<Type16ConstructKey, readonly [string, string]>> = {
  extraversion: ["I", "E"],
  feeling: ["T", "F"],
  intuition: ["S", "N"],
  judging: ["P", "J"],
};

function typeFromScores(
  scores: readonly Readonly<{ constructKey: Type16ConstructKey; normalizedScore: number }>[],
) {
  return type16ConstructKeys
    .map((key) => {
      const score = scores.find((candidate) => candidate.constructKey === key);
      if (!score) throw new RangeError(`Missing score for ${key}.`);
      return score.normalizedScore >= 50 ? letters[key][1] : letters[key][0];
    })
    .join("");
}

export function scoreType16Module(
  answers: readonly ModuleScoringAnswer<Type16ConstructKey>[],
  expectedAnswers: number,
): IndependentModuleResult<"type_16", Type16ConstructKey> {
  const scores = scoreConstructs(answers, type16ConstructKeys);
  const boundaryDistances = scores.map((score) => Math.abs(score.normalizedScore - 50));
  const closestIndex = boundaryDistances.indexOf(Math.min(...boundaryDistances));
  const primaryType = typeFromScores(scores);
  const alternateLetters = primaryType.split("");
  if (closestIndex >= 0) {
    const current = alternateLetters[closestIndex];
    const alternatives = letters[type16ConstructKeys[closestIndex]!];
    alternateLetters[closestIndex] =
      current === alternatives[0] ? alternatives[1] : alternatives[0];
  }
  const ambiguity = getBoundaryAmbiguity(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: type16ConstructKeys,
    expectedAnswers,
  });
  return {
    ambiguity: {
      alternateType: alternateLetters.join(""),
      boundaryDimension: type16ConstructKeys[closestIndex] ?? null,
      level: ambiguity,
    },
    confidence: quality.confidence,
    evidenceTier: "B",
    moduleKey: "type_16",
    quality,
    scores,
    scoringVersion: "type16-score-1",
    summary: {
      disclaimer: "16-Type Jungian-inspired untuk refleksi; bukan instrumen MBTI resmi.",
      primaryType,
    },
  };
}

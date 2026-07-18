import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";
import {
  getScoreGap,
  scoreConstructs,
  scoreQuality,
  type IndependentModuleResult,
} from "@/lib/scoring/modules/types";

export const attachmentConstructKeys = ["secure", "anxious", "avoidant", "fearful"] as const;
export type AttachmentConstructKey = (typeof attachmentConstructKeys)[number];

export function scoreAttachmentModule(
  answers: readonly ModuleScoringAnswer<AttachmentConstructKey>[],
  expectedAnswers: number,
  context?: QualityModelContext,
): IndependentModuleResult<"attachment", AttachmentConstructKey> {
  const scores = scoreConstructs(answers, attachmentConstructKeys);
  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const { ambiguity, gap } = getScoreGap(scores);
  const quality = scoreQuality({
    ambiguity,
    answers,
    constructKeys: attachmentConstructKeys,
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
    moduleKey: "attachment",
    quality,
    scores,
    scoringVersion: "attachment-score-1",
    summary: {
      dominantPattern: ordered[0]?.constructKey ?? null,
      disclaimer:
        "Attachment Reflection Lens bersifat non-klinis dan bukan diagnosis relasi atau kondisi psikologis.",
    },
  };
}

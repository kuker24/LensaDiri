import type { IndependentModuleResult } from "@/lib/scoring/modules/types";

export type ClarifierReasonCode =
  "threshold_ambiguity" | "reverse_inconsistency" | "low_module_coverage" | "low_confidence";

export interface ClarifierDecision {
  readonly itemCount: number;
  readonly moduleKey: string;
  readonly reasonCode: ClarifierReasonCode;
  readonly required: boolean;
  readonly targetConstructKeys: readonly string[];
}

export function decideClarifier(result: IndependentModuleResult): ClarifierDecision | null {
  const flags = new Set(result.quality.flags);
  let reasonCode: ClarifierReasonCode | null = null;
  if (flags.has("low_module_coverage")) reasonCode = "low_module_coverage";
  else if (flags.has("reverse_inconsistency")) reasonCode = "reverse_inconsistency";
  else if (flags.has("threshold_ambiguity")) reasonCode = "threshold_ambiguity";
  else if (result.confidence < 0.55) reasonCode = "low_confidence";
  if (!reasonCode) return null;

  const ambiguous = result.scores
    .toSorted(
      (left, right) => Math.abs(left.normalizedScore - 50) - Math.abs(right.normalizedScore - 50),
    )
    .slice(0, Math.min(3, result.scores.length))
    .map((score) => score.constructKey);
  const severe =
    reasonCode === "low_module_coverage" ||
    result.confidence < 0.35 ||
    (flags.has("reverse_inconsistency") && flags.has("too_fast"));
  const itemCount = Math.max(12, Math.min(24, 12 + Math.round((1 - result.confidence) * 12)));
  return {
    itemCount,
    moduleKey: result.moduleKey,
    reasonCode,
    required: severe,
    targetConstructKeys: ambiguous,
  };
}

import type { IndependentModuleResult } from "@/lib/scoring/modules/types";

export const correlationVersion = "correlation-rules-1" as const;

export interface CorrelationRuleResult {
  readonly confidence: number;
  readonly context: Readonly<Record<string, unknown>>;
  readonly kind:
    | "reinforcing"
    | "complementary"
    | "reflective_tension"
    | "context_dependent"
    | "low_confidence_conflict";
  readonly narrativeKey: string;
  readonly ruleKey: string;
  readonly sourceModuleKeys: readonly string[];
}

function scoreFor(result: IndependentModuleResult, constructKey: string): number | null {
  return (
    result.scores.find((score) => score.constructKey === constructKey)?.normalizedScore ?? null
  );
}

export function correlateModuleResults(
  results: readonly IndependentModuleResult[],
): readonly CorrelationRuleResult[] {
  const byKey = new Map(results.map((result) => [result.moduleKey, result]));
  const correlations: CorrelationRuleResult[] = [];
  const trait = byKey.get("trait_profile");
  const type16 = byKey.get("type_16");
  const temperament = byKey.get("temperament");
  const enneagram = byKey.get("enneagram");

  if (trait && type16) {
    const traitExtraversion = scoreFor(trait, "extraversion");
    const typeExtraversion = scoreFor(type16, "extraversion");
    if (traitExtraversion !== null && typeExtraversion !== null) {
      const difference = Math.abs(traitExtraversion - typeExtraversion);
      const confidence = Number(Math.min(trait.confidence, type16.confidence).toFixed(4));
      correlations.push({
        confidence,
        context: { difference: Number(difference.toFixed(2)) },
        kind: difference <= 18 ? "reinforcing" : "reflective_tension",
        narrativeKey:
          difference <= 18
            ? "correlation.social_energy.aligned"
            : "correlation.social_energy.context_tension",
        ruleKey: "social_energy_trait_type16",
        sourceModuleKeys: ["trait_profile", "type_16"],
      });
    }
  }

  if (type16 && temperament) {
    const typeExtraversion = scoreFor(type16, "extraversion");
    const sanguine = scoreFor(temperament, "sanguine");
    if (typeExtraversion !== null && sanguine !== null) {
      const aligned = typeExtraversion >= 50 === sanguine >= 50;
      correlations.push({
        confidence: Number(Math.min(type16.confidence, temperament.confidence).toFixed(4)),
        context: { sanguine, typeExtraversion },
        kind: aligned ? "reinforcing" : "context_dependent",
        narrativeKey: aligned
          ? "correlation.expression.aligned"
          : "correlation.expression.safe_context",
        ruleKey: "expression_type16_temperament",
        sourceModuleKeys: ["type_16", "temperament"],
      });
    }
  }

  if (enneagram && trait) {
    const pattern6 = scoreFor(enneagram, "pattern_6");
    const sensitivity = scoreFor(trait, "emotional_sensitivity");
    if (pattern6 !== null && sensitivity !== null) {
      correlations.push({
        confidence: Number(Math.min(enneagram.confidence, trait.confidence).toFixed(4)),
        context: { pattern6, sensitivity },
        kind: pattern6 >= 60 && sensitivity >= 60 ? "reinforcing" : "complementary",
        narrativeKey:
          pattern6 >= 60 && sensitivity >= 60
            ? "correlation.readiness.sensitivity_aligned"
            : "correlation.readiness.context_balance",
        ruleKey: "readiness_enneagram_trait",
        sourceModuleKeys: ["enneagram", "trait_profile"],
      });
    }
  }

  if (results.some((result) => result.confidence < 0.4) && results.length > 1) {
    correlations.push({
      confidence: Number(Math.min(...results.map((result) => result.confidence)).toFixed(4)),
      context: {
        lowConfidenceModules: results
          .filter((result) => result.confidence < 0.4)
          .map((result) => result.moduleKey),
      },
      kind: "low_confidence_conflict",
      narrativeKey: "correlation.mixed_confidence.caution",
      ruleKey: "mixed_confidence_warning",
      sourceModuleKeys: results.map((result) => result.moduleKey).toSorted(),
    });
  }

  return correlations.toSorted((left, right) => left.ruleKey.localeCompare(right.ruleKey));
}

import { describe, expect, it } from "vitest";

import { decideClarifier } from "@/lib/scoring/clarifier";
import { correlateModuleResults } from "@/lib/scoring/correlation";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";

function result(
  moduleKey: string,
  scores: Readonly<Record<string, number>>,
  options: Readonly<{
    confidence?: number;
    flags?: IndependentModuleResult["quality"]["flags"];
  }> = {},
): IndependentModuleResult {
  const confidence = options.confidence ?? 0.8;
  return {
    ambiguity: {},
    confidence,
    evidenceTier: moduleKey === "trait_profile" ? "A" : "B",
    moduleKey,
    quality: {
      averageResponseTimeMs: 1800,
      completion: 1,
      confidence,
      contradictionRate: 0,
      flags: options.flags ?? [],
      midpointRate: 0,
      qualityModelVersion: "module-quality-1",
      responseVariance: 1,
      uniqueResponses: 5,
    },
    scores: Object.entries(scores).map(([constructKey, normalizedScore]) => ({
      confidence,
      constructKey,
      facetKey: "general",
      normalizedScore,
      rawScore: 3,
    })),
    scoringVersion: `${moduleKey}-1`,
    summary: {},
  };
}

describe("clarifier policy", () => {
  it("returns no clarifier for stable high-confidence result", () => {
    expect(
      decideClarifier(result("type_16", { extraversion: 75 }, { confidence: 0.9 })),
    ).toBeNull();
  });

  it("targets ambiguous constructs with bounded item count", () => {
    const decision = decideClarifier(
      result(
        "type_16",
        { extraversion: 51, feeling: 70, intuition: 49, judging: 80 },
        { confidence: 0.5, flags: ["threshold_ambiguity", "clarifier_recommended"] },
      ),
    );
    expect(decision).toMatchObject({
      moduleKey: "type_16",
      reasonCode: "threshold_ambiguity",
      required: false,
      targetConstructKeys: ["extraversion", "intuition", "feeling"],
    });
    expect(decision!.itemCount).toBeGreaterThanOrEqual(12);
    expect(decision!.itemCount).toBeLessThanOrEqual(24);
  });

  it("makes severe low coverage required", () => {
    expect(
      decideClarifier(
        result(
          "enneagram",
          { pattern_1: 70 },
          {
            confidence: 0.2,
            flags: ["low_module_coverage", "clarifier_recommended"],
          },
        ),
      ),
    ).toMatchObject({ reasonCode: "low_module_coverage", required: true });
  });
});

describe("correlation rules", () => {
  it("emits aligned pattern without mutating source scores", () => {
    const trait = result("trait_profile", { extraversion: 72, emotional_sensitivity: 40 });
    const type16 = result("type_16", { extraversion: 68 });
    const snapshot = structuredClone([trait, type16]);
    const correlations = correlateModuleResults([trait, type16]);

    expect(correlations).toEqual([
      expect.objectContaining({
        kind: "reinforcing",
        narrativeKey: "correlation.social_energy.aligned",
        ruleKey: "social_energy_trait_type16",
      }),
    ]);
    expect([trait, type16]).toEqual(snapshot);
  });

  it("emits reflective social tension for diverging independently scored modules", () => {
    const correlations = correlateModuleResults([
      result("trait_profile", { extraversion: 25 }),
      result("type_16", { extraversion: 80 }),
    ]);
    expect(correlations).toEqual([
      expect.objectContaining({
        kind: "reflective_tension",
        narrativeKey: "correlation.social_energy.context_tension",
      }),
    ]);
  });

  it("adds mixed-confidence warning and keeps narrative separate", () => {
    const correlations = correlateModuleResults([
      result("type_16", { extraversion: 60 }, { confidence: 0.3 }),
      result("temperament", { sanguine: 70 }, { confidence: 0.8 }),
    ]);
    expect(correlations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "reinforcing", ruleKey: "expression_type16_temperament" }),
        expect.objectContaining({
          kind: "low_confidence_conflict",
          narrativeKey: "correlation.mixed_confidence.caution",
        }),
      ]),
    );
    expect(correlations.every((correlation) => !("score" in correlation))).toBe(true);
  });
});

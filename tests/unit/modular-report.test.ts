import { describe, expect, it } from "vitest";

import { buildIntegratedReflection, buildModuleReflection } from "@/lib/report/modular-report";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";

const moduleResult: IndependentModuleResult = {
  ambiguity: {},
  confidence: 0.82,
  evidenceTier: "A",
  moduleKey: "trait_profile",
  quality: {
    averageResponseTimeMs: 3200,
    completion: 1,
    confidence: 0.82,
    flags: [],
    midpointRate: 0.2,
    responseVariance: 1.1,
    uniqueResponses: 5,
  },
  scores: [
    {
      confidence: 1,
      constructKey: "openness",
      facetKey: "general",
      normalizedScore: 76,
      rawScore: 4.1,
    },
    {
      confidence: 1,
      constructKey: "conscientiousness",
      facetKey: "general",
      normalizedScore: 68,
      rawScore: 3.8,
    },
    {
      confidence: 1,
      constructKey: "extraversion",
      facetKey: "general",
      normalizedScore: 42,
      rawScore: 2.7,
    },
    {
      confidence: 1,
      constructKey: "agreeableness",
      facetKey: "general",
      normalizedScore: 61,
      rawScore: 3.5,
    },
    {
      confidence: 1,
      constructKey: "emotional_sensitivity",
      facetKey: "general",
      normalizedScore: 30,
      rawScore: 2.2,
    },
  ],
  scoringVersion: "trait-profile-score-1",
  summary: {},
};

describe("modular report assembly", () => {
  it("builds strengths and blind spots without changing primary scores", () => {
    const before = structuredClone(moduleResult.scores);
    const reflection = buildModuleReflection(moduleResult);

    expect(reflection.moduleKey).toBe("trait_profile");
    expect(reflection.strengths).toHaveLength(2);
    expect(reflection.blindSpots.length).toBeGreaterThan(0);
    expect(moduleResult.scores).toEqual(before);
  });

  it("builds all practical and growth sections deterministically", () => {
    const first = buildIntegratedReflection([moduleResult]);
    const second = buildIntegratedReflection([moduleResult]);

    expect(first).toEqual(second);
    expect(first.communication).not.toHaveLength(0);
    expect(first.learning).not.toHaveLength(0);
    expect(first.work).not.toHaveLength(0);
    expect(first.relationships).not.toHaveLength(0);
    expect(first.stress).not.toHaveLength(0);
    expect(first.growth7Days).toHaveLength(3);
    expect(first.growth30Days).toHaveLength(3);
  });
});

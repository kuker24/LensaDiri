import { describe, expect, it } from "vitest";

import { composeAssessment, type ComposerItemCandidate } from "@/lib/assessment/composer";
import type { AssessmentEstimate } from "@/lib/assessment/estimate";

function candidates(
  moduleKey: string,
  count: number,
  options: Readonly<{ dimensions?: number; reverseEvery?: number }> = {},
): ComposerItemCandidate[] {
  const dimensions = options.dimensions ?? 2;
  const reverseEvery = options.reverseEvery ?? 4;
  return Array.from({ length: count }, (_, index) => ({
    clarifierEnabled: index % 5 === 0,
    consistencyPairKey: null,
    constructKey: `dimension_${index % dimensions}`,
    dimensionId: `${moduleKey}-dimension-${index % dimensions}`,
    evidenceTier: moduleKey === "trait_profile" ? "A" : "B",
    exposureGroup: index === count - 1 ? `${moduleKey}-duplicate` : null,
    facetKey: "general",
    id: `${moduleKey}-question-${index}`,
    informationPriority: Number((1 - index / (count * 2)).toFixed(4)),
    itemBankVersion: `${moduleKey}-bank-1`,
    itemCode: `${moduleKey.toUpperCase()}_${String(index).padStart(3, "0")}`,
    minimumDimensionCoverage: 2,
    modeEligibility: ["quick", "standard", "deep"],
    moduleKey,
    moduleVersionId: `${moduleKey}-version-1`,
    polarity: index % reverseEvery === 0 ? -1 : 1,
    reportTemplateVersion: `${moduleKey}-report-1`,
    scoringVersion: `${moduleKey}-score-1`,
  }));
}

function estimate(
  allocations: readonly Readonly<{ itemCount: number; moduleKey: string }>[],
  segmentSize = 120,
): AssessmentEstimate {
  const itemCount = allocations.reduce((sum, allocation) => sum + allocation.itemCount, 0);
  const segmentPlan: Array<AssessmentEstimate["segmentPlan"][number]> = [];
  for (let start = 1, segmentIndex = 1; start <= itemCount; segmentIndex += 1) {
    const end = Math.min(itemCount, start + segmentSize - 1);
    segmentPlan.push({
      endItem: end,
      itemCount: end - start + 1,
      segmentIndex,
      startItem: start,
    });
    start = end + 1;
  }
  return {
    disclaimer: "test",
    estimatedMinutes: 10,
    itemCount,
    mode: "deep",
    moduleAllocation: allocations,
    precision: null,
    publicMode: "Complex",
    segmentPlan,
    selectionType: allocations.length === 1 ? "single" : "custom_combo",
  };
}

describe("Test Composer", () => {
  it("is deterministic for identical seed and input", () => {
    const equalPriorityCandidates = [
      ...candidates("trait_profile", 16),
      ...candidates("type_16", 16),
    ].map((candidate) => ({ ...candidate, informationPriority: 0.5 }));
    const input = {
      candidates: equalPriorityCandidates,
      contentVersion: "catalog-1",
      estimate: estimate([
        { itemCount: 12, moduleKey: "trait_profile" },
        { itemCount: 12, moduleKey: "type_16" },
      ]),
      locale: "id" as const,
      seed: "deterministic-seed",
    };
    expect(composeAssessment(input)).toEqual(composeAssessment(input));
    expect(composeAssessment({ ...input, seed: "other-seed" }).items).not.toEqual(
      composeAssessment(input).items,
    );
  });

  it("satisfies dimension coverage, reverse balance, dedupe, and module quotas", () => {
    const source = [...candidates("trait_profile", 20), ...candidates("type_16", 20)];
    source.push({
      ...source[0]!,
      id: "trait-profile-exposure-duplicate",
      informationPriority: 0.99,
      exposureGroup: "same-meaning",
    });
    source.push({
      ...source[1]!,
      id: "trait-profile-exposure-original",
      informationPriority: 1,
      exposureGroup: "same-meaning",
    });

    const blueprint = composeAssessment({
      candidates: source,
      contentVersion: "catalog-1",
      estimate: estimate([
        { itemCount: 12, moduleKey: "trait_profile" },
        { itemCount: 12, moduleKey: "type_16" },
      ]),
      locale: "id",
      seed: "balance-seed",
    });

    expect(blueprint.items).toHaveLength(24);
    expect(blueprint.modules).toEqual([
      expect.objectContaining({ itemCount: 12, moduleKey: "trait_profile", requiredAnswers: 12 }),
      expect.objectContaining({ itemCount: 12, moduleKey: "type_16", requiredAnswers: 12 }),
    ]);
    for (const moduleKey of ["trait_profile", "type_16"]) {
      const items = blueprint.items.filter((item) => item.moduleKey === moduleKey);
      expect(items.filter((item) => item.polarity === -1).length).toBeGreaterThanOrEqual(3);
      expect(new Set(items.map((item) => item.dimensionId)).size).toBe(2);
      expect(items.filter((item) => item.questionId.includes("exposure"))).toHaveLength(
        moduleKey === "trait_profile" ? 1 : 0,
      );
    }
    expect(blueprint.items.map((item) => item.displayOrder)).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
  });

  it("keeps every active segment within supplied cap", () => {
    const blueprint = composeAssessment({
      candidates: [...candidates("trait_profile", 70), ...candidates("type_16", 70)],
      contentVersion: "catalog-1",
      estimate: estimate(
        [
          { itemCount: 60, moduleKey: "trait_profile" },
          { itemCount: 60, moduleKey: "type_16" },
        ],
        60,
      ),
      locale: "id",
      seed: "segment-seed",
    });

    expect(blueprint.segmentPlan).toHaveLength(2);
    expect(
      [...Map.groupBy(blueprint.items, (item) => item.segmentIndex).values()].map(
        (items) => items.length,
      ),
    ).toEqual([60, 60]);
  });

  it("fails closed when item bank cannot satisfy quota or dimension coverage", () => {
    expect(() =>
      composeAssessment({
        candidates: candidates("trait_profile", 5),
        contentVersion: "catalog-1",
        estimate: estimate([{ itemCount: 10, moduleKey: "trait_profile" }]),
        locale: "id",
        seed: "short-bank",
      }),
    ).toThrow("Insufficient eligible items");

    expect(() =>
      composeAssessment({
        candidates: candidates("trait_profile", 6, { dimensions: 4 }),
        contentVersion: "catalog-1",
        estimate: estimate([{ itemCount: 6, moduleKey: "trait_profile" }]),
        locale: "id",
        seed: "coverage",
      }),
    ).toThrow("Insufficient dimension coverage");
  });

  it("rejects candidates from unselected modules", () => {
    expect(() =>
      composeAssessment({
        candidates: [...candidates("trait_profile", 12), ...candidates("type_16", 12)],
        contentVersion: "catalog-1",
        estimate: estimate([{ itemCount: 12, moduleKey: "trait_profile" }]),
        locale: "id",
        seed: "unexpected-module",
      }),
    ).toThrow("Candidate belongs to unselected module type_16");
  });
});

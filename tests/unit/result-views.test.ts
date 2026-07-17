import { describe, expect, it } from "vitest";

import { toExportResultView, toSafeSharedResultView } from "@/server/repositories/result-views";
import type { PrivateResultView } from "@/server/repositories/assessment";

const privateModularResult: PrivateResultView = {
  correlations: [
    {
      confidence: 0.42,
      kind: "reflective_tension",
      narrativeKey: "correlation.social_energy.context_tension",
      ruleKey: "social_energy_trait_type16",
      sourceModuleKeys: ["trait_profile", "type_16"],
    },
  ],
  createdAt: "2026-07-16T10:00:00.000Z",
  kind: "modular",
  modules: [
    {
      ambiguity: { level: 0.8, reason: "threshold" },
      confidence: 0.42,
      evidenceTier: "A",
      moduleKey: "trait_profile",
      quality: {
        averageResponseTimeMs: 250,
        completion: 1,
        confidence: 0.42,
        contradictionRate: 0,
        flags: ["too_fast", "straightlining", "low_variance", "reverse_inconsistency"],
        midpointRate: 0.8,
        responseVariance: 0,
        uniqueResponses: 1,
      },
      scores: [
        {
          confidence: 0.42,
          constructKey: "extraversion",
          facetKey: "general",
          normalizedScore: 67,
          rawScore: 3.67,
        },
      ],
      scoringVersion: "trait-profile-modular-1",
      summary: {
        archetype: "eksploratif dan ekspresif",
        disclaimer: "Lensa refleksi, bukan diagnosis.",
      },
    },
  ],
  quality: {
    confidence: 0.42,
    flags: ["low_variance", "clarifier_recommended"],
  },
  summary: {
    disclaimer: "Hasil ini bersifat reflektif.",
    moduleKeys: ["trait_profile"],
  },
};

const privateLegacyResult: PrivateResultView = {
  createdAt: "2026-07-16T10:00:00.000Z",
  kind: "legacy",
  quality: {
    answeredItems: 40,
    confidence: 0.8,
    straightLineWarning: true,
  },
  scores: [
    {
      confidence: 0.8,
      constructKey: "openness",
      normalizedScore: 72,
      rawScore: 3.88,
    },
  ],
  summary: {
    archetype: "eksploratif",
    disclaimer: "Lensa refleksi, bukan diagnosis.",
    growthFocus: ["Ubah ide menjadi eksperimen kecil."],
    overlays: {
      motivation: { label: "Pola reflektif", note: "Bukan tipe resmi." },
      temperament: { label: "Tenang-stabil", note: "Bukan kategori biologis." },
      type16: { label: "INFP", note: "Bukan instrumen proprietary." },
    },
    strengths: ["Rasa ingin tahu terlihat menonjol."],
    traitScores: {
      agreeableness: 56,
      conscientiousness: 61,
      emotional_sensitivity: 48,
      extraversion: 52,
      openness: 72,
    },
  },
};

const safeMetadata = {
  expiresAt: "2026-07-23T10:00:00.000Z",
  scope: "summary" as const,
};

const prohibitedSharedFields = [
  "ambiguity",
  "averageResponseTimeMs",
  "clarifier",
  "confidence",
  "flags",
  "low_variance",
  "quality",
  "rawScore",
  "reverse_inconsistency",
  "ruleKey",
  "scoringVersion",
  "straightlining",
  "too_fast",
];

describe("safe shared result projection", () => {
  it("keeps private modular diagnostics private and allowlists public summary fields", () => {
    expect(privateModularResult.kind).toBe("modular");
    if (privateModularResult.kind !== "modular") throw new Error("Expected modular fixture.");
    expect(privateModularResult.quality.flags).toContain("low_variance");
    expect(privateModularResult.modules[0]?.quality.flags).toContain("too_fast");

    const shared = toSafeSharedResultView(privateModularResult, "summary", safeMetadata);
    const serialized = JSON.stringify(shared);

    expect(shared).toEqual({
      correlations: [
        {
          kind: "reflective_tension",
          narrativeKey: "correlation.social_energy.context_tension",
          sourceModules: [
            { key: "trait_profile", name: "Profil Trait" },
            { key: "type_16", name: "16-Type" },
          ],
        },
      ],
      createdAt: "2026-07-16T10:00:00.000Z",
      disclaimer: "Hasil ini bersifat reflektif.",
      kind: "modular",
      modules: [
        {
          disclaimer: "Lensa refleksi, bukan diagnosis.",
          evidenceTier: "A",
          key: "trait_profile",
          name: "Profil Trait",
          scores: [
            {
              constructKey: "extraversion",
              facetKey: "general",
              label: "Energi sosial",
              normalizedScore: 67,
            },
          ],
          title: "eksploratif dan ekspresif",
        },
      ],
      share: safeMetadata,
      title: "Hasil reflektif modular",
    });
    for (const field of prohibitedSharedFields) {
      expect(serialized).not.toContain(field);
    }
    expect(serialized).not.toContain("3.67");
  });

  it("keeps legacy share useful while excluding score confidence and quality diagnostics", () => {
    const shared = toSafeSharedResultView(privateLegacyResult, "summary", safeMetadata);
    const serialized = JSON.stringify(shared);

    expect(shared).toMatchObject({
      disclaimer: "Lensa refleksi, bukan diagnosis.",
      kind: "legacy",
      scores: [
        {
          constructKey: "openness",
          label: "Keterbukaan",
          normalizedScore: 72,
        },
      ],
      title: "eksploratif",
    });
    expect(shared).not.toHaveProperty("quality");
    expect(serialized).not.toContain("straightLineWarning");
    expect(serialized).not.toContain("rawScore");
    expect(serialized).not.toContain("confidence");
  });

  it("fails closed for unsupported share scope and creates separate portable export contract", () => {
    expect(() =>
      toSafeSharedResultView(privateModularResult, "detail", {
        expiresAt: safeMetadata.expiresAt,
        scope: "summary",
      }),
    ).toThrow("Unsupported public share scope.");

    const exported = toExportResultView(privateModularResult);
    expect(exported).toMatchObject({
      contractVersion: "result-export-1",
      result: { kind: "modular" },
    });
    expect(JSON.stringify(exported)).not.toContain("resultTokenHash");
    expect(JSON.stringify(exported)).not.toContain("accountId");
    expect(JSON.stringify(exported)).not.toContain("ruleKey");
  });
});

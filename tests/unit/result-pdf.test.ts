import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resultConstructLabels } from "@/lib/report/result-presentation";
import { buildResultPdfBuffer, pdfFilenameForResult } from "@/server/export/build-result-pdf";
import { formatPdfLabel } from "@/server/export/pdf-labels";
import { buildResultPdfModel } from "@/server/export/result-pdf-model";
import type { PrivateResultView } from "@/server/repositories/assessment";

const privateLegacyResult: PrivateResultView = {
  createdAt: "2026-07-16T10:00:00.000Z",
  kind: "legacy",
  quality: {
    answeredItems: 40,
    confidence: 0.8,
    straightLineWarning: true,
  },
  scores: [
    { confidence: 0.8, constructKey: "openness", normalizedScore: 72, rawScore: 3.88 },
    { confidence: 0.8, constructKey: "conscientiousness", normalizedScore: 61, rawScore: 3.4 },
    { confidence: 0.8, constructKey: "extraversion", normalizedScore: 52, rawScore: 3.1 },
    { confidence: 0.8, constructKey: "agreeableness", normalizedScore: 56, rawScore: 3.2 },
    {
      confidence: 0.8,
      constructKey: "emotional_sensitivity",
      normalizedScore: 48,
      rawScore: 2.9,
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

const privateModularCombo: PrivateResultView = {
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
  mode: "standard",
  modules: [
    {
      ambiguity: { level: 0.2 },
      confidence: 0.72,
      evidenceTier: "A",
      moduleKey: "trait_profile",
      quality: {
        averageResponseTimeMs: 1200,
        completion: 1,
        confidence: 0.72,
        contradictionRate: 0,
        flags: [],
        midpointRate: 0.2,
        qualityModelVersion: "module-quality-1",
        responseVariance: 0.4,
        uniqueResponses: 4,
      },
      scores: [
        {
          confidence: 0.7,
          constructKey: "extraversion",
          facetKey: "general",
          normalizedScore: 67,
          rawScore: 3.67,
        },
        {
          confidence: 0.7,
          constructKey: "openness",
          facetKey: "general",
          normalizedScore: 74,
          rawScore: 3.9,
        },
      ],
      scoringVersion: "trait-profile-modular-1",
      summary: {
        archetype: "eksploratif dan ekspresif",
        disclaimer: "Lensa refleksi, bukan diagnosis.",
      },
    },
    {
      ambiguity: {},
      confidence: 0.65,
      evidenceTier: "B",
      moduleKey: "type_16",
      quality: {
        averageResponseTimeMs: 1100,
        completion: 1,
        confidence: 0.65,
        contradictionRate: 0,
        flags: [],
        midpointRate: 0.15,
        qualityModelVersion: "module-quality-1",
        responseVariance: 0.5,
        uniqueResponses: 4,
      },
      scores: [
        {
          confidence: 0.6,
          constructKey: "extraversion",
          facetKey: "general",
          normalizedScore: 40,
          rawScore: 2.5,
        },
        {
          confidence: 0.6,
          constructKey: "intuition",
          facetKey: "general",
          normalizedScore: 70,
          rawScore: 3.7,
        },
      ],
      scoringVersion: "type-16-1",
      summary: {
        primaryType: "INFP-like",
        disclaimer: "Reflektif, bukan instrumen proprietary.",
      },
    },
  ],
  quality: {
    confidence: 0.68,
    flags: [],
  },
  summary: {
    disclaimer: "Hasil ini bersifat reflektif.",
    moduleKeys: ["trait_profile", "type_16"],
  },
};

describe("result PDF export", () => {
  it("builds printable models for legacy and modular combo without internal secrets", () => {
    const legacyModel = buildResultPdfModel(privateLegacyResult);
    expect(legacyModel.kind).toBe("legacy");
    expect(legacyModel.legacy?.scores).toHaveLength(5);
    expect(legacyModel.title).toBe("eksploratif");
    expect(legacyModel.identities).toHaveLength(4);
    expect(legacyModel.identities[1]).toEqual({ name: "16-Type reflektif", title: "INFP" });

    const modularModel = buildResultPdfModel(privateModularCombo);
    expect(modularModel.kind).toBe("modular");
    expect(modularModel.modular?.modules).toHaveLength(2);
    expect(modularModel.modular?.correlations[0]?.narrative).toMatch(/konteks/i);
    // The PDF carries plain-language overrides for a few module names, so
    // `type_16` reads as "Tipe 16 Karakter" here while the web report keeps
    // its shorter "16-Type" label.
    expect(modularModel.identities).toEqual([
      { name: "Profil Trait", title: "Eksploratif dan ekspresif" },
      { name: "Tipe 16 Karakter", title: "INFP-like" },
    ]);
    expect(modularModel.modular?.overallConfidenceLabel).toBe("Cukup terbaca · 68 dari 100");
    expect(modularModel.title).toBe("Hasilmu dalam 2 lensa");
    expect(modularModel.modular?.modules[0]?.scores[0]).toMatchObject({
      reading: "Menonjol",
      score: 74,
    });
    expect(modularModel.selectionLabel).toMatch(/2 lensa/i);
  });

  it("renders valid PDF buffers for legacy and multi-module results", async () => {
    const legacyPdf = await buildResultPdfBuffer(privateLegacyResult);
    expect(legacyPdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(legacyPdf.byteLength).toBeGreaterThan(1_500);

    const modularPdf = await buildResultPdfBuffer(privateModularCombo);
    expect(modularPdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(modularPdf.byteLength).toBeGreaterThan(1_500);

    const legacyText = legacyPdf.toString("latin1");
    const modularText = modularPdf.toString("latin1");
    for (const prohibited of ["resultTokenHash", "accountId", "raw_value", "session_id"]) {
      expect(legacyText).not.toContain(prohibited);
      expect(modularText).not.toContain(prohibited);
    }

    expect(pdfFilenameForResult(privateLegacyResult)).toMatch(
      /^lensadiri-laporan-legacy-\d{4}-\d{2}-\d{2}\.pdf$/u,
    );
    expect(pdfFilenameForResult(privateModularCombo)).toMatch(
      /^lensadiri-laporan-modular-2lensa-\d{4}-\d{2}-\d{2}\.pdf$/u,
    );

    const outDir = path.join(process.cwd(), ".pi", "pdf-samples");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, "sample-legacy.pdf"), legacyPdf);
    writeFileSync(path.join(outDir, "sample-modular-combo.pdf"), modularPdf);
  }, 30_000);

  it("labels every construct the scoring engines can emit", () => {
    // `requireConstructLabel` in `result-views.ts` throws on an unknown key, so
    // a gap here is not merely cosmetic: a shared result carrying an unlabelled
    // construct fails closed instead of rendering. Four keys were missing -
    // `instinct_social`, `instinct_one_to_one`, `instinct_self_preservation`
    // and `rationality` - which also printed sentence-cased English identifiers
    // into an Indonesian PDF.
    const emitted = [
      "instinct_one_to_one",
      "instinct_self_preservation",
      "instinct_social",
      "rationality",
      ...Array.from({ length: 9 }, (_, index) => `pattern_${index + 1}`),
    ];
    for (const key of emitted) {
      expect(resultConstructLabels[key], `missing label for ${key}`).toBeTruthy();
      // A leaked identifier reads as the key with underscores swapped out.
      expect(formatPdfLabel(key)).not.toBe(key.replaceAll("_", " "));
      expect(formatPdfLabel(key)).not.toMatch(/^Instinct |^Rationality$|^Pattern /u);
    }
  });

  it("omits the fixed growth plans and the footer strap from the export", () => {
    const model = buildResultPdfModel(privateModularCombo);
    // Removed on request. These were fixed copy that never varied with the
    // answers, so they read as filler in a printed report. The web report keeps
    // them, where a live product can act on them.
    expect(model.modular?.integrated).not.toHaveProperty("growth7Days");
    expect(model.modular?.integrated).not.toHaveProperty("growth30Days");
  });

  it("carries numeric confidence for charts, and null when it is not measured", () => {
    const model = buildResultPdfModel(privateModularCombo);
    const [trait] = model.modular?.modules ?? [];
    // Chart geometry needs the magnitude; re-parsing it out of the prose label
    // would be fragile.
    expect(trait?.confidence).toBe(72);
    expect(trait?.confidenceLabel).toContain("72");

    // An experimental lens is genuinely not scored for confidence. Null must
    // survive to the chart so it can draw "not measured" rather than a zero
    // column, which would claim no support instead of no measurement.
    const experimental = buildResultPdfModel({
      ...privateModularCombo,
      modules: [{ ...privateModularCombo.modules[0]!, evidenceTier: "EXPERIMENTAL" }],
    } as PrivateResultView);
    expect(experimental.modular?.modules[0]?.confidence).toBeNull();
    expect(experimental.modular?.modules[0]?.confidenceLabel).toBeNull();
  });
});

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildResultPdfBuffer, pdfFilenameForResult } from "@/server/export/build-result-pdf";
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

    const modularModel = buildResultPdfModel(privateModularCombo);
    expect(modularModel.kind).toBe("modular");
    expect(modularModel.modular?.modules).toHaveLength(2);
    expect(modularModel.modular?.correlations[0]?.narrative).toMatch(/konteks/i);
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
});

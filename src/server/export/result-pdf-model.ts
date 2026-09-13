import fs from "node:fs";
import path from "node:path";

import { getPublicModeName } from "@/lib/assessment/catalog";
import { buildIntegratedReflection, buildModuleReflection } from "@/lib/report/modular-report";
import { resolveStageTheme, resolveTypeCode, STAGE_THEMES } from "@/lib/report/type-theme";
import {
  confidenceReading,
  formatModuleResultTitle,
  isExperimentalEvidence,
  scoreReading,
} from "@/lib/report/result-presentation";
import type { PrivateResultView } from "@/server/repositories/assessment";
import {
  constructLabels,
  correlationKindLabels,
  evidenceTierLabels,
  formatPdfLabel,
  moduleLabels,
  narrativeLabels,
} from "@/server/export/pdf-labels";

export type PdfScoreRow = {
  readonly label: string;
  readonly reading: string;
  readonly score: number;
};

export type PdfLegacyBlock = {
  readonly archetype: string;
  readonly growthFocus: readonly string[];
  readonly overlays: readonly {
    readonly label: string;
    readonly note: string;
    readonly title: string;
  }[];
  readonly qualityNote: string;
  readonly scores: readonly PdfScoreRow[];
  readonly strengths: readonly string[];
};

export type PdfModuleBlock = {
  readonly blindSpots: readonly string[];
  /**
   * Confidence as a 0-100 number, or null for an experimental lens that is not
   * scored for confidence at all.
   *
   * The label string alone was not enough once the overview gained a column
   * chart: a chart needs the magnitude, and re-parsing it out of the prose label
   * would be fragile. Null is carried through rather than coerced to 0, because
   * "not measured" and "measured as zero" must not draw the same mark.
   */
  readonly confidence: number | null;
  readonly confidenceLabel: string | null;
  readonly disclaimer: string;
  readonly evidenceTierLabel: string;
  readonly name: string;
  readonly practicalReflection: string;
  readonly scores: readonly PdfScoreRow[];
  readonly strengths: readonly string[];
  readonly title: string;
};

export type PdfModularBlock = {
  readonly correlations: readonly {
    readonly kindLabel: string;
    readonly narrative: string;
    readonly sources: string;
  }[];
  /**
   * Everyday reflection only.
   *
   * The 7-day and 30-day plans that `buildIntegratedReflection` also returns are
   * deliberately not carried into the export. They are fixed copy that does not
   * vary with the answers, so in a printed report they read as filler next to
   * the sections that genuinely respond to the result. The web report still
   * shows them, where they sit beside a live product that can act on them.
   */
  readonly integrated: {
    readonly communication: string;
    readonly learning: string;
    readonly relationships: string;
    readonly stress: string;
    readonly work: string;
  };
  readonly modeLabel: string;
  readonly modules: readonly PdfModuleBlock[];
  readonly overallConfidenceLabel: string | null;
};

/**
 * Cover art and accent colour derived from the reflected type.
 *
 * `figurinePath` is an absolute filesystem path, not a URL: the PDF renderer
 * runs server-side and cannot fetch from `/public`. It is null when the file is
 * missing, so a failed lookup degrades to a colour-only cover instead of
 * throwing during export.
 */
export type PdfCoverArt = {
  readonly accent: string;
  readonly accentSoft: string;
  readonly figurinePath: string | null;
  readonly ink: string;
  readonly stageName: string;
  readonly typeCode: string | null;
};

export type ResultPdfModel = {
  readonly cover: PdfCoverArt;
  readonly createdAtLabel: string;
  readonly disclaimer: string;
  readonly exportedAtLabel: string;
  readonly identities: readonly {
    readonly name: string;
    readonly title: string;
  }[];
  readonly kind: "legacy" | "modular";
  readonly legacy: PdfLegacyBlock | null;
  readonly modular: PdfModularBlock | null;
  readonly selectionLabel: string;
  readonly subtitle: string;
  readonly title: string;
};

function formatDateId(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(parsed);
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

type ModularModule = Extract<PrivateResultView, { kind: "modular" }>["modules"][number];

function moduleTitle(module: ModularModule): string {
  return formatModuleResultTitle(module.moduleKey, asRecord(module.summary));
}

function moduleDisclaimer(module: ModularModule): string {
  const summary = asRecord(module.summary);
  return (
    optionalString(summary.disclaimer) ??
    "Hasil ini adalah lensa reflektif, bukan diagnosis atau kepastian tentang diri seseorang."
  );
}

function isExperimentalTier(tier: string): boolean {
  return isExperimentalEvidence(tier);
}

function confidenceLabel(confidence: number): string {
  return `${confidenceReading(confidence)} · ${Math.round(confidence * 100)} dari 100`;
}

/**
 * Resolve the cover figurine on disk.
 *
 * The gender-neutral `{CODE}.png` render is used on purpose: the picked body is
 * stored client-side only (`gender-storage`), so the server genuinely does not
 * know it and must not guess. Returns null when the render is absent, which
 * keeps export working on a colour-only cover rather than failing.
 */
function resolveCoverFigurine(typeCode: string | null): string | null {
  if (!typeCode) return null;
  const candidate = path.join(process.cwd(), "public", "figurines", `${typeCode}.png`);
  return fs.existsSync(candidate) ? candidate : null;
}

function buildCoverArt(result: PrivateResultView): PdfCoverArt {
  const theme = resolveStageTheme(result);
  const typeCode = resolveTypeCode(result);
  return {
    accent: theme.bg,
    accentSoft: theme.panel,
    figurinePath: resolveCoverFigurine(typeCode),
    ink: theme.ink,
    stageName: STAGE_THEMES[theme.code].name,
    typeCode,
  };
}

function toLegacy(result: Extract<PrivateResultView, { kind: "legacy" }>): PdfLegacyBlock {
  return {
    archetype: result.summary.archetype,
    growthFocus: result.summary.growthFocus,
    overlays: [
      {
        label: result.summary.overlays.type16.label,
        note: result.summary.overlays.type16.note,
        title: "16-Type reflektif",
      },
      {
        label: result.summary.overlays.motivation.label,
        note: result.summary.overlays.motivation.note,
        title: "Motivasi reflektif",
      },
      {
        label: result.summary.overlays.temperament.label,
        note: result.summary.overlays.temperament.note,
        title: "Temperamen reflektif",
      },
    ],
    qualityNote: result.quality.straightLineWarning
      ? `${confidenceLabel(result.quality.confidence)} · ${result.quality.answeredItems} pertanyaan · pola jawaban seragam terdeteksi, jadi baca lebih hati-hati.`
      : `${confidenceLabel(result.quality.confidence)} · ${result.quality.answeredItems} pertanyaan terjawab.`,
    scores: result.scores.map((score) => ({
      label: formatPdfLabel(score.constructKey, constructLabels),
      reading: scoreReading(score.normalizedScore),
      score: Math.round(score.normalizedScore),
    })),
    strengths: result.summary.strengths,
  };
}

function toModular(result: Extract<PrivateResultView, { kind: "modular" }>): PdfModularBlock {
  const hasEvidenceOriented = result.modules.some(
    (module) => !isExperimentalTier(module.evidenceTier),
  );
  const integrated = buildIntegratedReflection(result.modules);

  return {
    correlations: result.correlations.map((correlation) => ({
      kindLabel: formatPdfLabel(correlation.kind, correlationKindLabels),
      narrative:
        narrativeLabels[correlation.narrativeKey] ??
        "Baca perbedaan antar-lensa sebagai konteks, bukan kontradiksi mutlak.",
      sources: correlation.sourceModuleKeys
        .map((key) => formatPdfLabel(key, moduleLabels))
        .join(" · "),
    })),
    integrated: {
      communication: integrated.communication,
      learning: integrated.learning,
      relationships: integrated.relationships,
      stress: integrated.stress,
      work: integrated.work,
    },
    modeLabel: getPublicModeName(result.mode),
    modules: result.modules.map((module) => {
      const reflection = buildModuleReflection(module);
      const experimental = isExperimentalTier(module.evidenceTier);
      return {
        blindSpots: reflection.blindSpots,
        confidence: experimental ? null : Math.round(module.confidence * 100),
        confidenceLabel: experimental ? null : confidenceLabel(module.confidence),
        disclaimer: moduleDisclaimer(module),
        evidenceTierLabel:
          evidenceTierLabels[module.evidenceTier] ?? `Tingkat bukti ${module.evidenceTier}`,
        name: formatPdfLabel(module.moduleKey, moduleLabels),
        practicalReflection: reflection.practicalReflection,
        scores: module.scores
          .toSorted(
            (left, right) =>
              right.normalizedScore - left.normalizedScore ||
              left.constructKey.localeCompare(right.constructKey),
          )
          .map((score) => ({
            label: formatPdfLabel(score.constructKey, constructLabels),
            reading: scoreReading(score.normalizedScore),
            score: Math.round(score.normalizedScore),
          })),
        strengths: reflection.strengths,
        title: moduleTitle(module),
      };
    }),
    overallConfidenceLabel: hasEvidenceOriented ? confidenceLabel(result.quality.confidence) : null,
  };
}

export function buildResultPdfModel(
  result: PrivateResultView,
  exportedAt = new Date(),
): ResultPdfModel {
  const exportedAtLabel = formatDateId(exportedAt.toISOString());
  const createdAtLabel = formatDateId(result.createdAt);

  if (result.kind === "legacy") {
    return {
      cover: buildCoverArt(result),
      createdAtLabel,
      disclaimer: result.summary.disclaimer,
      exportedAtLabel,
      identities: [
        { name: "Profil Trait", title: result.summary.archetype },
        {
          name: "16-Type reflektif",
          title: result.summary.overlays.type16.label,
        },
        {
          name: "Motivasi reflektif",
          title: result.summary.overlays.motivation.label,
        },
        {
          name: "Temperamen reflektif",
          title: result.summary.overlays.temperament.label,
        },
      ],
      kind: "legacy",
      legacy: toLegacy(result),
      modular: null,
      selectionLabel: "Profil versi awal · lima sisi",
      subtitle: "Laporan refleksi pribadi",
      title: result.summary.archetype,
    };
  }

  const modular = toModular(result);
  const lensCount = result.modules.length;
  const selectionLabel =
    lensCount === 1
      ? `1 lensa · mode ${modular.modeLabel}`
      : `${lensCount} lensa · mode ${modular.modeLabel}`;

  return {
    cover: buildCoverArt(result),
    createdAtLabel,
    disclaimer: result.summary.disclaimer,
    exportedAtLabel,
    identities: result.modules.map((module) => ({
      name: formatPdfLabel(module.moduleKey, moduleLabels),
      title: moduleTitle(module),
    })),
    kind: "modular",
    legacy: null,
    modular,
    selectionLabel,
    subtitle: "Laporan refleksi pribadi",
    title:
      lensCount === 1
        ? (modular.modules[0]?.title ?? "Hasil satu lensa")
        : `Hasilmu dalam ${lensCount} lensa`,
  };
}

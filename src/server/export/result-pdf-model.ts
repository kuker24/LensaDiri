import { getPublicModeName } from "@/lib/assessment/catalog";
import { buildIntegratedReflection, buildModuleReflection } from "@/lib/report/modular-report";
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
  readonly integrated: {
    readonly communication: string;
    readonly growth30Days: readonly string[];
    readonly growth7Days: readonly string[];
    readonly learning: string;
    readonly relationships: string;
    readonly stress: string;
    readonly work: string;
  };
  readonly modeLabel: string;
  readonly modules: readonly PdfModuleBlock[];
  readonly overallConfidenceLabel: string | null;
};

export type ResultPdfModel = {
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
      growth30Days: integrated.growth30Days,
      growth7Days: integrated.growth7Days,
      learning: integrated.learning,
      relationships: integrated.relationships,
      stress: integrated.stress,
      work: integrated.work,
    },
    modeLabel: getPublicModeName(result.mode),
    modules: result.modules.map((module) => {
      const reflection = buildModuleReflection(module);
      return {
        blindSpots: reflection.blindSpots,
        confidenceLabel: isExperimentalTier(module.evidenceTier)
          ? null
          : confidenceLabel(module.confidence),
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
      selectionLabel: "Profil legacy · lima spektrum",
      subtitle: "Laporan refleksi pribadi",
      title: result.summary.archetype,
    };
  }

  const modular = toModular(result);
  const lensCount = result.modules.length;
  const selectionLabel =
    lensCount === 1
      ? `Modular · 1 lensa · mode ${modular.modeLabel}`
      : `Modular · ${lensCount} lensa · mode ${modular.modeLabel}`;

  return {
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

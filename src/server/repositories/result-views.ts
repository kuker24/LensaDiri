import type {
  LegacyResultView,
  ModularResultView,
  PrivateResultView,
} from "@/server/repositories/assessment";

export const publicShareScopes = ["summary"] as const;
export type PublicShareScope = (typeof publicShareScopes)[number];

export type SafeSharedMetadata = {
  readonly expiresAt: string;
  readonly scope: PublicShareScope;
};

type PublicScore = {
  readonly constructKey: string;
  readonly facetKey: string;
  readonly label: string;
  readonly normalizedScore: number;
};

type SafeSharedLegacyResultView = {
  readonly createdAt: string;
  readonly disclaimer: string;
  readonly growthFocus: readonly string[];
  readonly kind: "legacy";
  readonly overlays: readonly {
    readonly label: string;
    readonly note: string;
    readonly title: string;
  }[];
  readonly scores: readonly PublicScore[];
  readonly share: SafeSharedMetadata;
  readonly strengths: readonly string[];
  readonly title: string;
};

type SafeSharedModuleResult = {
  readonly disclaimer: string;
  readonly evidenceTier: "A" | "B" | "B_EXPERIMENTAL" | "EXPERIMENTAL" | "C";
  readonly key: string;
  readonly name: string;
  readonly scores: readonly PublicScore[];
  readonly title: string;
};

type SafeSharedModularResultView = {
  readonly correlations: readonly {
    readonly kind: string;
    readonly narrativeKey: string;
    readonly sourceModules: readonly { readonly key: string; readonly name: string }[];
  }[];
  readonly createdAt: string;
  readonly disclaimer: string;
  readonly kind: "modular";
  readonly modules: readonly SafeSharedModuleResult[];
  readonly share: SafeSharedMetadata;
  readonly title: string;
};

export type SafeSharedResultView = SafeSharedLegacyResultView | SafeSharedModularResultView;

type ExportLegacyResult = {
  readonly createdAt: string;
  readonly kind: "legacy";
  readonly quality: {
    readonly answeredItems: number;
    readonly confidence: number;
    readonly straightLineWarning: boolean;
  };
  readonly scores: readonly {
    readonly confidence: number;
    readonly constructKey: string;
    readonly normalizedScore: number;
    readonly rawScore: number;
  }[];
  readonly summary: {
    readonly archetype: string;
    readonly disclaimer: string;
    readonly growthFocus: readonly string[];
    readonly overlays: readonly {
      readonly label: string;
      readonly note: string;
      readonly title: string;
    }[];
    readonly strengths: readonly string[];
  };
};

type ExportModularResult = {
  readonly correlations: readonly {
    readonly kind: string;
    readonly narrativeKey: string;
    readonly sourceModuleKeys: readonly string[];
  }[];
  readonly createdAt: string;
  readonly kind: "modular";
  readonly modules: readonly {
    readonly confidence: number;
    readonly disclaimer: string;
    readonly evidenceTier: "A" | "B" | "B_EXPERIMENTAL" | "EXPERIMENTAL" | "C";
    readonly key: string;
    readonly name: string;
    readonly quality: { readonly completion: number; readonly flags: readonly string[] };
    readonly scores: readonly {
      readonly confidence: number;
      readonly constructKey: string;
      readonly facetKey: string;
      readonly normalizedScore: number;
      readonly rawScore: number;
    }[];
    readonly title: string;
  }[];
  readonly quality: { readonly confidence: number; readonly flags: readonly string[] };
  readonly summary: { readonly disclaimer: string; readonly moduleKeys: readonly string[] };
};

export type ExportResultView = {
  readonly contractVersion: "result-export-1";
  readonly result: ExportLegacyResult | ExportModularResult;
};

const moduleNames: Readonly<Record<string, string>> = {
  enneagram: "Enneagram",
  temperament: "Temperament",
  trait_profile: "Profil Trait",
  type_16: "16-Type",
};

const constructLabels: Readonly<Record<string, string>> = {
  agreeableness: "Kooperasi",
  choleric: "Penggerak",
  conscientiousness: "Keteraturan",
  emotional_sensitivity: "Kepekaan emosi",
  enneagram: "Enneagram",
  extraversion: "Energi sosial",
  feeling: "Pertimbangan manusia",
  intuition: "Pola dan kemungkinan",
  judging: "Struktur keputusan",
  melancholic: "Mendalam",
  openness: "Keterbukaan",
  pattern_1: "Pola 1",
  pattern_2: "Pola 2",
  pattern_3: "Pola 3",
  pattern_4: "Pola 4",
  pattern_5: "Pola 5",
  pattern_6: "Pola 6",
  pattern_7: "Pola 7",
  pattern_8: "Pola 8",
  pattern_9: "Pola 9",
  phlegmatic: "Stabil",
  sanguine: "Ekspresif",
  temperament: "Temperament",
  trait_profile: "Profil Trait",
  type_16: "16-Type",
};

export function isPublicShareScope(value: string): value is PublicShareScope {
  return publicShareScopes.includes(value as PublicShareScope);
}

function requirePublicShareScope(value: string): PublicShareScope {
  if (!isPublicShareScope(value)) throw new RangeError("Unsupported public share scope.");
  return value;
}

function requireModuleName(moduleKey: string): string {
  const name = moduleNames[moduleKey];
  if (!name) throw new RangeError(`Unsupported public module: ${moduleKey}.`);
  return name;
}

function requireConstructLabel(constructKey: string): string {
  const label = constructLabels[constructKey];
  if (!label) throw new RangeError(`Unsupported public construct: ${constructKey}.`);
  return label;
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function publicModuleTitle(result: ModularResultView["modules"][number]): string {
  const summary = asRecord(result.summary);
  const candidate =
    optionalString(summary.archetype) ??
    optionalString(summary.primaryType) ??
    optionalString(summary.corePattern) ??
    optionalString(summary.primary);
  return candidate ?? requireModuleName(result.moduleKey);
}

function publicModuleDisclaimer(result: ModularResultView["modules"][number]): string {
  const summary = asRecord(result.summary);
  return (
    optionalString(summary.disclaimer) ??
    "Hasil ini adalah lensa reflektif, bukan diagnosis atau kepastian tentang diri seseorang."
  );
}

function toPublicScore(input: {
  readonly constructKey: string;
  readonly facetKey?: string;
  readonly normalizedScore: number;
}): PublicScore {
  return {
    constructKey: input.constructKey,
    facetKey: input.facetKey ?? "general",
    label: requireConstructLabel(input.constructKey),
    normalizedScore: input.normalizedScore,
  };
}

function toSafeLegacyResult(
  result: LegacyResultView,
  share: SafeSharedMetadata,
): SafeSharedLegacyResultView {
  return {
    createdAt: result.createdAt,
    disclaimer: result.summary.disclaimer,
    growthFocus: result.summary.growthFocus.map((item) => item),
    kind: "legacy",
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
        title: "Temperament reflektif",
      },
    ],
    scores: result.scores.map((score) =>
      toPublicScore({
        constructKey: score.constructKey,
        normalizedScore: score.normalizedScore,
      }),
    ),
    share,
    strengths: result.summary.strengths.map((item) => item),
    title: result.summary.archetype,
  };
}

function toSafeModularResult(
  result: ModularResultView,
  share: SafeSharedMetadata,
): SafeSharedModularResultView {
  return {
    correlations: result.correlations.map((correlation) => ({
      kind: correlation.kind,
      narrativeKey: correlation.narrativeKey,
      sourceModules: correlation.sourceModuleKeys.map((moduleKey) => ({
        key: moduleKey,
        name: requireModuleName(moduleKey),
      })),
    })),
    createdAt: result.createdAt,
    disclaimer: result.summary.disclaimer,
    kind: "modular",
    modules: result.modules.map((module) => ({
      disclaimer: publicModuleDisclaimer(module),
      evidenceTier: module.evidenceTier,
      key: module.moduleKey,
      name: requireModuleName(module.moduleKey),
      scores: module.scores.map((score) =>
        toPublicScore({
          constructKey: score.constructKey,
          facetKey: score.facetKey,
          normalizedScore: score.normalizedScore,
        }),
      ),
      title: publicModuleTitle(module),
    })),
    share,
    title: "Hasil reflektif modular",
  };
}

export function toSafeSharedResultView(
  privateResult: PrivateResultView,
  shareScope: string,
  metadata: SafeSharedMetadata,
): SafeSharedResultView {
  const scope = requirePublicShareScope(shareScope);
  if (metadata.scope !== scope) throw new RangeError("Public share metadata scope is invalid.");
  return privateResult.kind === "legacy"
    ? toSafeLegacyResult(privateResult, metadata)
    : toSafeModularResult(privateResult, metadata);
}

function toExportLegacyResult(result: LegacyResultView): ExportLegacyResult {
  return {
    createdAt: result.createdAt,
    kind: "legacy",
    quality: {
      answeredItems: result.quality.answeredItems,
      confidence: result.quality.confidence,
      straightLineWarning: result.quality.straightLineWarning,
    },
    scores: result.scores.map((score) => ({
      confidence: score.confidence,
      constructKey: score.constructKey,
      normalizedScore: score.normalizedScore,
      rawScore: score.rawScore,
    })),
    summary: {
      archetype: result.summary.archetype,
      disclaimer: result.summary.disclaimer,
      growthFocus: result.summary.growthFocus.map((item) => item),
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
          title: "Temperament reflektif",
        },
      ],
      strengths: result.summary.strengths.map((item) => item),
    },
  };
}

function toExportModularResult(result: ModularResultView): ExportModularResult {
  return {
    correlations: result.correlations.map((correlation) => ({
      kind: correlation.kind,
      narrativeKey: correlation.narrativeKey,
      sourceModuleKeys: correlation.sourceModuleKeys.map((moduleKey) => moduleKey),
    })),
    createdAt: result.createdAt,
    kind: "modular",
    modules: result.modules.map((module) => ({
      confidence: module.confidence,
      disclaimer: publicModuleDisclaimer(module),
      evidenceTier: module.evidenceTier,
      key: module.moduleKey,
      name: requireModuleName(module.moduleKey),
      quality: {
        completion: module.quality.completion,
        flags: module.quality.flags.map((flag) => flag),
      },
      scores: module.scores.map((score) => ({
        confidence: score.confidence,
        constructKey: score.constructKey,
        facetKey: score.facetKey,
        normalizedScore: score.normalizedScore,
        rawScore: score.rawScore,
      })),
      title: publicModuleTitle(module),
    })),
    quality: {
      confidence: result.quality.confidence,
      flags: result.quality.flags.map((flag) => flag),
    },
    summary: {
      disclaimer: result.summary.disclaimer,
      moduleKeys: result.summary.moduleKeys.map((moduleKey) => moduleKey),
    },
  };
}

export function toExportResultView(privateResult: PrivateResultView): ExportResultView {
  return {
    contractVersion: "result-export-1",
    result:
      privateResult.kind === "legacy"
        ? toExportLegacyResult(privateResult)
        : toExportModularResult(privateResult),
  };
}

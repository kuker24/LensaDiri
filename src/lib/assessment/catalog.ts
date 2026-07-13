export const assessmentModes = ["quick", "standard", "deep"] as const;
export type AssessmentMode = (typeof assessmentModes)[number];

export const assessmentSelectionTypes = [
  "single",
  "custom_combo",
  "preset_combo",
  "full_spectrum",
  "legacy",
] as const;
export type AssessmentSelectionType = (typeof assessmentSelectionTypes)[number];

export const evidenceTiers = ["A", "B", "B_EXPERIMENTAL", "EXPERIMENTAL", "C"] as const;
export type EvidenceTier = (typeof evidenceTiers)[number];

export const moduleCategories = [
  "trait",
  "typology",
  "motivation",
  "communication",
  "career",
  "relationship",
  "experimental",
  "cultural",
] as const;
export type ModuleCategory = (typeof moduleCategories)[number];

export const selectableModuleStatuses = ["active", "pilot", "published", "experimental"] as const;
export type SelectableModuleStatus = (typeof selectableModuleStatuses)[number];

export type ModuleModeQuota = Readonly<Record<AssessmentMode, number>>;

export interface AssessmentModuleDefinition {
  readonly category: ModuleCategory;
  readonly defaultOrder: number;
  readonly description: string;
  readonly evidenceTier: EvidenceTier;
  readonly isExperimental: boolean;
  readonly isSelectable: boolean;
  readonly key: string;
  readonly minimumAge: number;
  readonly modeQuota: ModuleModeQuota;
  readonly publicName: string;
  readonly status: SelectableModuleStatus | "draft" | "paused" | "retired";
  readonly version: string | null;
}

export interface AssessmentModeProfile {
  readonly description: string;
  readonly internalMode: AssessmentMode;
  readonly isSelectable: boolean;
  readonly maxItemsPerSegment: number;
  readonly provisionalPrecision: Readonly<{ max: number; min: number }> | null;
  readonly publicName: "Quick" | "Normal" | "Complex";
  readonly secondsPerItem: number;
  readonly singleModuleItems: Readonly<{ max: number; min: number }>;
  readonly targetItems: Readonly<{ max: number; min: number }>;
}

export interface ComboPresetDefinition {
  readonly description: string;
  readonly isFullSpectrum: boolean;
  readonly key: string;
  readonly moduleKeys: readonly string[];
  readonly publicName: string;
  readonly recommendedMode: AssessmentMode;
  readonly status: SelectableModuleStatus | "draft" | "paused" | "retired";
}

export interface ModuleCatalogDto {
  readonly modules: readonly AssessmentModuleDefinition[];
}

export interface ComboCatalogDto {
  readonly combos: readonly ComboPresetDefinition[];
}

export interface AssessmentSelectionInput {
  readonly age: number | null;
  readonly experimentalAcknowledged: boolean;
  readonly mode: AssessmentMode;
  readonly moduleKeys: readonly string[];
  readonly presetKey: string | null;
  readonly selectionType: Exclude<AssessmentSelectionType, "legacy">;
}

export interface SelectionValidationSuccess {
  readonly modules: readonly AssessmentModuleDefinition[];
  readonly preset: ComboPresetDefinition | null;
  readonly valid: true;
}

export interface SelectionValidationFailure {
  readonly code:
    | "age_restricted"
    | "experimental_acknowledgment_required"
    | "invalid_module_count"
    | "module_unavailable"
    | "preset_mismatch"
    | "preset_unavailable"
    | "selection_type_mismatch";
  readonly valid: false;
}

export type SelectionValidationResult = SelectionValidationSuccess | SelectionValidationFailure;

export function getPublicModeName(mode: AssessmentMode): AssessmentModeProfile["publicName"] {
  if (mode === "standard") return "Normal";
  if (mode === "deep") return "Complex";
  return "Quick";
}

export function isPubliclyAvailableModule(module: AssessmentModuleDefinition): boolean {
  return (
    module.isSelectable &&
    selectableModuleStatuses.includes(module.status as SelectableModuleStatus)
  );
}

export function validateAssessmentSelection(
  input: AssessmentSelectionInput,
  catalog: readonly AssessmentModuleDefinition[],
  presets: readonly ComboPresetDefinition[],
): SelectionValidationResult {
  const moduleKeys = [...new Set(input.moduleKeys)];
  const minimumModules = input.selectionType === "single" ? 1 : 2;
  if (
    moduleKeys.length < minimumModules ||
    moduleKeys.length > 10 ||
    (input.selectionType === "single" && moduleKeys.length !== 1)
  ) {
    return { code: "invalid_module_count", valid: false };
  }

  const modules = moduleKeys.map((key) => catalog.find((module) => module.key === key));
  if (modules.some((module) => !module || !isPubliclyAvailableModule(module))) {
    return { code: "module_unavailable", valid: false };
  }
  const selectedModules = modules.filter(
    (module): module is AssessmentModuleDefinition => module !== undefined,
  );

  if (selectedModules.some((module) => input.age !== null && input.age < module.minimumAge)) {
    return { code: "age_restricted", valid: false };
  }
  if (selectedModules.some((module) => module.isExperimental) && !input.experimentalAcknowledged) {
    return { code: "experimental_acknowledgment_required", valid: false };
  }

  if (input.selectionType === "preset_combo" || input.selectionType === "full_spectrum") {
    if (!input.presetKey) return { code: "preset_unavailable", valid: false };
    const preset = presets.find((candidate) => candidate.key === input.presetKey);
    if (!preset || !selectableModuleStatuses.includes(preset.status as SelectableModuleStatus)) {
      return { code: "preset_unavailable", valid: false };
    }
    if (input.selectionType === "full_spectrum" && !preset.isFullSpectrum) {
      return { code: "selection_type_mismatch", valid: false };
    }
    if (input.selectionType === "preset_combo" && preset.isFullSpectrum) {
      return { code: "selection_type_mismatch", valid: false };
    }
    if (
      preset.moduleKeys.length !== moduleKeys.length ||
      preset.moduleKeys.some((key) => !moduleKeys.includes(key))
    ) {
      return { code: "preset_mismatch", valid: false };
    }
    return { modules: selectedModules, preset, valid: true };
  }

  if (input.presetKey !== null) return { code: "selection_type_mismatch", valid: false };
  return { modules: selectedModules, preset: null, valid: true };
}

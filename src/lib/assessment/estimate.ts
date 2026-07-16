import {
  type AssessmentModeProfile,
  type AssessmentModuleDefinition,
  type AssessmentSelectionInput,
  type ComboPresetDefinition,
  getPublicModeName,
  validateAssessmentSelection,
} from "@/lib/assessment/catalog";

export interface AssessmentEstimate {
  readonly disclaimer: string;
  readonly estimatedMinutes: number;
  readonly itemCount: number;
  readonly mode: AssessmentSelectionInput["mode"];
  readonly moduleAllocation: readonly Readonly<{ itemCount: number; moduleKey: string }>[];
  readonly precision: Readonly<{ max: number; min: number }> | null;
  readonly publicMode: ReturnType<typeof getPublicModeName>;
  readonly segmentPlan: readonly Readonly<{
    endItem: number;
    itemCount: number;
    segmentIndex: number;
    startItem: number;
  }>[];
  readonly selectionType: AssessmentSelectionInput["selectionType"];
}

export type AssessmentEstimateResult =
  | Readonly<{ estimate: AssessmentEstimate; success: true }>
  | Readonly<{
      code:
        | "age_restricted"
        | "experimental_acknowledgment_required"
        | "invalid_module_count"
        | "mode_unavailable"
        | "module_unavailable"
        | "preset_mismatch"
        | "preset_unavailable"
        | "selection_type_mismatch";
      success: false;
    }>;

export const provisionalPrecisionDisclaimer =
  "Angka ini adalah perkiraan internal tingkat kedalaman dan stabilitas hasil, bukan jaminan akurasi ilmiah atau validasi psikometrik formal.";

function distributeTarget(
  modules: readonly AssessmentModuleDefinition[],
  mode: AssessmentSelectionInput["mode"],
  target: number,
  minimumCoverage: Readonly<Record<string, number>>,
): readonly Readonly<{ itemCount: number; moduleKey: string }>[] {
  const requested = modules.map((module) => Math.max(1, module.modeQuota[mode]));
  const requestedTotal = requested.reduce((sum, count) => sum + count, 0);

  const base = requested.map((count) => Math.max(1, Math.floor((count / requestedTotal) * target)));
  let assigned = base.reduce((sum, count) => sum + count, 0);
  const fractions = requested
    .map((count, index) => ({
      fraction: (count / requestedTotal) * target - base[index]!,
      index,
      order: modules[index]!.defaultOrder,
    }))
    .toSorted((left, right) => right.fraction - left.fraction || left.order - right.order);

  for (let index = 0; assigned < target; index += 1) {
    const recipient = fractions[index % fractions.length];
    if (!recipient) break;
    base[recipient.index] = (base[recipient.index] ?? 0) + 1;
    assigned += 1;
  }

  const minimums = modules.map((module) => Math.max(1, minimumCoverage[module.key] ?? 1));
  const minimumTotal = minimums.reduce((sum, count) => sum + count, 0);
  if (minimumTotal > target) {
    throw new RangeError(`Module minimum coverage ${minimumTotal} exceeds target ${target}.`);
  }

  for (const recipient of modules.map((_, index) => index)) {
    let deficit = minimums[recipient]! - base[recipient]!;
    while (deficit > 0) {
      const donor = modules
        .map((module, index) => ({
          index,
          order: module.defaultOrder,
          surplus: base[index]! - minimums[index]!,
        }))
        .filter((candidate) => candidate.surplus > 0)
        .toSorted((left, right) => right.surplus - left.surplus || left.order - right.order)[0];
      if (!donor) throw new RangeError("Module allocation cannot satisfy minimum coverage.");
      const transfer = Math.min(deficit, donor.surplus);
      base[donor.index] = base[donor.index]! - transfer;
      base[recipient] = base[recipient]! + transfer;
      deficit -= transfer;
    }
  }

  return modules.map((module, index) => ({
    itemCount: base[index] ?? 1,
    moduleKey: module.key,
  }));
}

function getTargetItemCount(
  input: AssessmentSelectionInput,
  modules: readonly AssessmentModuleDefinition[],
  profile: AssessmentModeProfile,
): number {
  if (modules.length === 1) {
    return Math.max(
      profile.singleModuleItems.min,
      Math.min(profile.singleModuleItems.max, modules[0]!.modeQuota[input.mode]),
    );
  }

  const requested = modules.reduce((sum, module) => sum + module.modeQuota[input.mode], 0);
  return Math.max(profile.targetItems.min, Math.min(profile.targetItems.max, requested));
}

function buildSegmentPlan(
  itemCount: number,
  maxItemsPerSegment: number,
): AssessmentEstimate["segmentPlan"] {
  const segments: Array<AssessmentEstimate["segmentPlan"][number]> = [];
  for (let startItem = 1, segmentIndex = 1; startItem <= itemCount; segmentIndex += 1) {
    const endItem = Math.min(itemCount, startItem + maxItemsPerSegment - 1);
    segments.push({
      endItem,
      itemCount: endItem - startItem + 1,
      segmentIndex,
      startItem,
    });
    startItem = endItem + 1;
  }
  return segments;
}

export function estimateAssessment(
  input: AssessmentSelectionInput,
  catalog: readonly AssessmentModuleDefinition[],
  presets: readonly ComboPresetDefinition[],
  modeProfiles: readonly AssessmentModeProfile[],
  options: Readonly<{
    minimumCoverage?: Readonly<Record<string, number>>;
    provisionalPrecisionEnabled: boolean;
  }> = {
    provisionalPrecisionEnabled: false,
  },
): AssessmentEstimateResult {
  const validation = validateAssessmentSelection(input, catalog, presets);
  if (!validation.valid) return { code: validation.code, success: false };

  const profile = modeProfiles.find((candidate) => candidate.internalMode === input.mode);
  if (!profile?.isSelectable) return { code: "mode_unavailable", success: false };

  const modules = validation.modules.toSorted(
    (left, right) => left.defaultOrder - right.defaultOrder,
  );
  const itemCount = getTargetItemCount(input, modules, profile);
  const moduleAllocation = distributeTarget(
    modules,
    input.mode,
    itemCount,
    options.minimumCoverage ?? {},
  );
  const estimatedMinutes = Math.max(1, Math.ceil((itemCount * profile.secondsPerItem) / 60));

  return {
    estimate: {
      disclaimer: provisionalPrecisionDisclaimer,
      estimatedMinutes,
      itemCount,
      mode: input.mode,
      moduleAllocation,
      precision: options.provisionalPrecisionEnabled ? profile.provisionalPrecision : null,
      publicMode: profile.publicName,
      segmentPlan: buildSegmentPlan(itemCount, profile.maxItemsPerSegment),
      selectionType: input.selectionType,
    },
    success: true,
  };
}

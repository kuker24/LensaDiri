import type { AssessmentEstimate } from "@/lib/assessment/estimate";
import type { AssessmentMode, EvidenceTier } from "@/lib/assessment/catalog";
import type { ItemPolarity } from "@/lib/scoring/likert";

export const composerVersion = "modular-composer-1" as const;

export interface ComposerItemCandidate {
  readonly clarifierEnabled: boolean;
  readonly consistencyPairKey: string | null;
  readonly constructKey: string;
  readonly dimensionId: string;
  readonly evidenceTier: EvidenceTier;
  readonly exposureGroup: string | null;
  readonly facetKey: string;
  readonly id: string;
  readonly informationPriority: number;
  readonly itemBankVersion: string;
  readonly itemCode: string;
  readonly minimumDimensionCoverage: number;
  readonly modeEligibility: readonly AssessmentMode[];
  readonly moduleKey: string;
  readonly moduleVersionId: string;
  readonly polarity: ItemPolarity;
  readonly reportTemplateVersion: string;
  readonly scoringVersion: string;
}

export interface ComposedBlueprintItem {
  readonly consistencyPairKey: string | null;
  readonly constructKey: string;
  readonly dimensionId: string;
  readonly displayOrder: number;
  readonly facetKey: string;
  readonly itemCode: string;
  readonly moduleDisplayOrder: number;
  readonly moduleKey: string;
  readonly moduleVersionId: string;
  readonly polarity: ItemPolarity;
  readonly questionId: string;
  readonly scoringRole: "primary";
  readonly sectionKey: string;
  readonly segmentIndex: number;
}

export interface ComposedModuleAllocation {
  readonly evidenceTier: EvidenceTier;
  readonly itemBankVersion: string;
  readonly itemCount: number;
  readonly moduleKey: string;
  readonly moduleVersionId: string;
  readonly reportTemplateVersion: string;
  readonly requiredAnswers: number;
  readonly scoringVersion: string;
}

export interface ComposedBlueprint {
  readonly composerVersion: typeof composerVersion;
  readonly contentVersion: string;
  readonly estimatedMinutes: number;
  readonly itemCount: number;
  readonly items: readonly ComposedBlueprintItem[];
  readonly locale: "id" | "en";
  readonly mode: AssessmentMode;
  readonly modules: readonly ComposedModuleAllocation[];
  readonly seed: string;
  readonly segmentPlan: AssessmentEstimate["segmentPlan"];
  readonly selectionType: AssessmentEstimate["selectionType"];
}

export interface ComposeAssessmentInput {
  readonly candidates: readonly ComposerItemCandidate[];
  readonly contentVersion: string;
  readonly estimate: AssessmentEstimate;
  readonly locale: "id" | "en";
  readonly seed: string;
}

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function compareCandidate(seed: string, left: ComposerItemCandidate, right: ComposerItemCandidate) {
  return (
    right.informationPriority - left.informationPriority ||
    stableHash(`${seed}:${left.id}`) - stableHash(`${seed}:${right.id}`) ||
    left.itemCode.localeCompare(right.itemCode)
  );
}

function deduplicateCandidates(
  candidates: readonly ComposerItemCandidate[],
  seed: string,
): ComposerItemCandidate[] {
  const byId = new Map<string, ComposerItemCandidate>();
  for (const candidate of candidates) {
    byId.set(candidate.id, candidate);
  }

  const ordered = [...byId.values()].toSorted((left, right) => compareCandidate(seed, left, right));
  const exposureGroups = new Set<string>();
  return ordered.filter((candidate) => {
    if (!candidate.exposureGroup) return true;
    if (exposureGroups.has(candidate.exposureGroup)) return false;
    exposureGroups.add(candidate.exposureGroup);
    return true;
  });
}

function selectModuleItems(
  moduleKey: string,
  quota: number,
  mode: AssessmentMode,
  candidates: readonly ComposerItemCandidate[],
  seed: string,
): ComposerItemCandidate[] {
  const eligible = deduplicateCandidates(
    candidates.filter(
      (candidate) => candidate.moduleKey === moduleKey && candidate.modeEligibility.includes(mode),
    ),
    `${seed}:${moduleKey}`,
  );
  if (eligible.length < quota) {
    throw new RangeError(
      `Insufficient eligible items for ${moduleKey}: ${eligible.length}/${quota}.`,
    );
  }

  const byDimension = Map.groupBy(
    eligible,
    (candidate) => `${candidate.constructKey}:${candidate.facetKey}`,
  );
  const selected = new Map<string, ComposerItemCandidate>();
  const dimensionKeys = [...byDimension.keys()].toSorted();

  for (const dimensionKey of dimensionKeys) {
    const items = byDimension.get(dimensionKey) ?? [];
    const required = Math.max(...items.map((item) => item.minimumDimensionCoverage));
    if (items.length < required) {
      throw new RangeError(`Insufficient dimension coverage for ${moduleKey}/${dimensionKey}.`);
    }
    for (const item of items.slice(0, required)) selected.set(item.id, item);
  }
  if (selected.size > quota) {
    throw new RangeError(`Module quota cannot satisfy minimum coverage for ${moduleKey}.`);
  }

  const reverseTarget = Math.min(
    eligible.filter((candidate) => candidate.polarity === -1).length,
    Math.max(1, Math.floor(quota * 0.25)),
  );
  const selectedReverse = () =>
    [...selected.values()].filter((candidate) => candidate.polarity === -1).length;

  for (const reverseCandidate of eligible.filter((candidate) => candidate.polarity === -1)) {
    if (selectedReverse() >= reverseTarget) break;
    if (selected.has(reverseCandidate.id)) continue;
    const matchingPositive = [...selected.values()]
      .toReversed()
      .find(
        (candidate) =>
          candidate.polarity === 1 &&
          candidate.constructKey === reverseCandidate.constructKey &&
          candidate.facetKey === reverseCandidate.facetKey,
      );
    if (!matchingPositive) continue;
    selected.delete(matchingPositive.id);
    selected.set(reverseCandidate.id, reverseCandidate);
  }

  for (const candidate of eligible) {
    if (selected.size >= quota || selected.has(candidate.id)) continue;
    if (selectedReverse() < reverseTarget && candidate.polarity !== -1) continue;
    selected.set(candidate.id, candidate);
  }
  for (const candidate of eligible) {
    if (selected.size >= quota) break;
    selected.set(candidate.id, candidate);
  }

  if (selected.size !== quota) {
    throw new RangeError(`Unable to allocate requested item quota for ${moduleKey}.`);
  }
  if (selectedReverse() < reverseTarget) {
    throw new RangeError(`Unable to satisfy reverse-item balance for ${moduleKey}.`);
  }
  return [...selected.values()];
}

function assertSingleModuleProvenance(
  moduleKey: string,
  candidates: readonly ComposerItemCandidate[],
): void {
  const provenance = new Set(
    candidates.map(
      (candidate) =>
        `${candidate.moduleVersionId}\u0000${candidate.scoringVersion}\u0000${candidate.itemBankVersion}\u0000${candidate.reportTemplateVersion}\u0000${candidate.evidenceTier}`,
    ),
  );
  if (provenance.size !== 1) {
    throw new RangeError(`Mixed immutable provenance for ${moduleKey}.`);
  }
}

function interleaveModules(
  allocations: readonly Readonly<{
    moduleKey: string;
    selected: readonly ComposerItemCandidate[];
  }>[],
): ComposerItemCandidate[] {
  const output: ComposerItemCandidate[] = [];
  const maximum = Math.max(...allocations.map((allocation) => allocation.selected.length));
  for (let index = 0; index < maximum; index += 1) {
    for (const allocation of allocations) {
      const candidate = allocation.selected[index];
      if (candidate) output.push(candidate);
    }
  }
  return output;
}

function findSegmentIndex(
  displayOrder: number,
  segments: AssessmentEstimate["segmentPlan"],
): number {
  const segment = segments.find(
    (candidate) => displayOrder >= candidate.startItem && displayOrder <= candidate.endItem,
  );
  if (!segment) throw new RangeError("Composer order does not fit estimate segment plan.");
  return segment.segmentIndex;
}

export function composeAssessment(input: ComposeAssessmentInput): ComposedBlueprint {
  if (!input.seed.trim() || !input.contentVersion.trim()) {
    throw new RangeError("Composer seed and content version are required.");
  }
  const requestedKeys = input.estimate.moduleAllocation.map((allocation) => allocation.moduleKey);
  const unexpectedModule = input.candidates.find(
    (candidate) => !requestedKeys.includes(candidate.moduleKey),
  );
  if (unexpectedModule) {
    throw new RangeError(`Candidate belongs to unselected module ${unexpectedModule.moduleKey}.`);
  }

  const allocations = input.estimate.moduleAllocation.map((allocation) => {
    const moduleCandidates = input.candidates.filter(
      (candidate) => candidate.moduleKey === allocation.moduleKey,
    );
    assertSingleModuleProvenance(allocation.moduleKey, moduleCandidates);
    return {
      moduleKey: allocation.moduleKey,
      selected: selectModuleItems(
        allocation.moduleKey,
        allocation.itemCount,
        input.estimate.mode,
        moduleCandidates,
        input.seed,
      ),
    };
  });
  const ordered = interleaveModules(allocations);
  if (ordered.length !== input.estimate.itemCount) {
    throw new RangeError("Composed item count does not match estimate.");
  }

  const moduleCounters = new Map<string, number>();
  const items = ordered.map((candidate, index): ComposedBlueprintItem => {
    const displayOrder = index + 1;
    const moduleDisplayOrder = (moduleCounters.get(candidate.moduleKey) ?? 0) + 1;
    moduleCounters.set(candidate.moduleKey, moduleDisplayOrder);
    return {
      consistencyPairKey: candidate.consistencyPairKey,
      constructKey: candidate.constructKey,
      dimensionId: candidate.dimensionId,
      displayOrder,
      facetKey: candidate.facetKey,
      itemCode: candidate.itemCode,
      moduleDisplayOrder,
      moduleKey: candidate.moduleKey,
      moduleVersionId: candidate.moduleVersionId,
      polarity: candidate.polarity,
      questionId: candidate.id,
      scoringRole: "primary",
      sectionKey: candidate.moduleKey,
      segmentIndex: findSegmentIndex(displayOrder, input.estimate.segmentPlan),
    };
  });

  const modules = allocations.map((allocation): ComposedModuleAllocation => {
    const first = allocation.selected[0];
    if (!first) throw new RangeError(`Module ${allocation.moduleKey} has no selected items.`);
    return {
      evidenceTier: first.evidenceTier,
      itemBankVersion: first.itemBankVersion,
      itemCount: allocation.selected.length,
      moduleKey: allocation.moduleKey,
      moduleVersionId: first.moduleVersionId,
      reportTemplateVersion: first.reportTemplateVersion,
      requiredAnswers: allocation.selected.length,
      scoringVersion: first.scoringVersion,
    };
  });

  return {
    composerVersion,
    contentVersion: input.contentVersion,
    estimatedMinutes: input.estimate.estimatedMinutes,
    itemCount: items.length,
    items,
    locale: input.locale,
    mode: input.estimate.mode,
    modules,
    seed: input.seed,
    segmentPlan: input.estimate.segmentPlan,
    selectionType: input.estimate.selectionType,
  };
}

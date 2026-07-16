import "server-only";

import type { AssessmentSelectionInput } from "@/lib/assessment/catalog";
import { estimateAssessment } from "@/lib/assessment/estimate";
import {
  composeFromDatabase,
  getMinimumModuleCoverage,
  loadComposerCandidates,
  persistModularSession,
} from "@/server/repositories/blueprints";
import {
  isFeatureEnabled,
  listAssessmentModeProfiles,
  listCatalogModules,
  listComboPresets,
} from "@/server/repositories/catalog";
import { createAssessmentSession } from "@/server/repositories/assessment";

export type LegacyStartRequest = Readonly<{
  kind: "legacy";
  mode: "quick" | "standard";
}>;

export type ModularStartRequest = Readonly<{
  kind: "modular";
  locale: "id" | "en";
  selection: AssessmentSelectionInput;
}>;

export type StartAssessmentRequest = LegacyStartRequest | ModularStartRequest;

export type StartAssessmentResult =
  | Readonly<{ kind: "legacy" | "modular"; success: true }>
  | Readonly<{
      code:
        | "age_restricted"
        | "experimental_acknowledgment_required"
        | "feature_unavailable"
        | "invalid_module_count"
        | "mode_unavailable"
        | "module_unavailable"
        | "preset_mismatch"
        | "preset_unavailable"
        | "selection_type_mismatch";
      success: false;
    }>;

export async function startAssessment(input: {
  accountId: string | null;
  consentVersion: string;
  expiresAt: Date;
  request: StartAssessmentRequest;
  sessionTokenHash: string;
}): Promise<StartAssessmentResult> {
  if (input.request.kind === "legacy") {
    await createAssessmentSession({
      accountId: input.accountId,
      consentVersion: input.consentVersion,
      expiresAt: input.expiresAt,
      mode: input.request.mode,
      sessionTokenHash: input.sessionTokenHash,
    });
    return { kind: "legacy", success: true };
  }

  if (!(await isFeatureEnabled("FEATURE_MODULAR_COMPOSER"))) {
    return { code: "feature_unavailable", success: false };
  }

  const [modules, combos, modeProfiles, complexEnabled] = await Promise.all([
    listCatalogModules(),
    listComboPresets(),
    listAssessmentModeProfiles(),
    isFeatureEnabled("FEATURE_COMPLEX_MODE"),
  ]);
  const availableModes = modeProfiles.map((profile) =>
    profile.internalMode === "deep" ? { ...profile, isSelectable: complexEnabled } : profile,
  );
  const candidates = await loadComposerCandidates(input.request.selection.moduleKeys);
  const estimate = estimateAssessment(input.request.selection, modules, combos, availableModes, {
    minimumCoverage: getMinimumModuleCoverage(candidates),
    provisionalPrecisionEnabled: false,
  });
  if (!estimate.success) return estimate;

  const blueprint = await composeFromDatabase({
    candidates,
    contentVersion: "modular-catalog-1",
    estimate: estimate.estimate,
    locale: input.request.locale,
    seed: input.sessionTokenHash,
  });
  await persistModularSession({
    accountId: input.accountId,
    blueprint,
    consentVersion: input.consentVersion,
    expiresAt: input.expiresAt,
    sessionTokenHash: input.sessionTokenHash,
  });
  return { kind: "modular", success: true };
}

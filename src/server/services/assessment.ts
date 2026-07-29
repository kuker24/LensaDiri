import "server-only";

import type { AssessmentSelectionInput } from "@/lib/assessment/catalog";
import { hasAssessmentCandidateCapacity } from "@/lib/assessment/composer";
import { estimateAssessment } from "@/lib/assessment/estimate";
import { getServerEnvironment } from "@/lib/db/env";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { opaqueTokenSchema } from "@/lib/validation/assessment";
import { DatabaseTimeoutError } from "@/lib/async/with-deadline";
import {
  composeFromDatabase,
  getMinimumModuleCoverage,
  loadComposerCandidates,
  persistModularSession,
} from "@/server/repositories/blueprints";
import {
  isFeatureEnabledBatch,
  listAssessmentModeProfiles,
  listCatalogModules,
  listComboPresets,
} from "@/server/repositories/catalog";
import {
  createAssessmentSession,
  getResultByHash,
  type PrivateResultView,
} from "@/server/repositories/assessment";

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
        | "coverage_unavailable"
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

export async function getPrivateResultByToken(token: string): Promise<PrivateResultView | null> {
  if (!opaqueTokenSchema.safeParse(token).success) return null;

  const environment = getServerEnvironment();
  return getResultByHash(hashOpaqueToken(token, environment.tokenHashPepper));
}

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

  const readStartTime = Date.now();
  const flags = await isFeatureEnabledBatch([
    "FEATURE_MODULAR_COMPOSER",
    "FEATURE_COMPLEX_MODE",
    "FEATURE_PROVISIONAL_PRECISION",
  ]);
  if (!flags.FEATURE_MODULAR_COMPOSER) {
    return { code: "feature_unavailable", success: false };
  }
  const [modules, combos, modeProfiles, candidates] = await Promise.all([
    listCatalogModules(),
    listComboPresets(),
    listAssessmentModeProfiles(),
    loadComposerCandidates(input.request.selection.moduleKeys),
  ]);
  const availableModes = modeProfiles.map((profile) =>
    profile.internalMode === "deep"
      ? { ...profile, isSelectable: flags.FEATURE_COMPLEX_MODE === true }
      : profile,
  );
  // If reading database metadata took more than 5 seconds, abort before beginning
  // any write transaction. This prevents late commits near the route deadline.
  if (Date.now() - readStartTime > 5_000) {
    throw new DatabaseTimeoutError("Database read operations took too long.");
  }
  const estimate = estimateAssessment(input.request.selection, modules, combos, availableModes, {
    minimumCoverage: getMinimumModuleCoverage(candidates, input.request.selection.mode),
    provisionalPrecisionEnabled: flags.FEATURE_PROVISIONAL_PRECISION === true,
  });
  if (!estimate.success) return estimate;
  if (!hasAssessmentCandidateCapacity(candidates, estimate.estimate, input.sessionTokenHash)) {
    return { code: "module_unavailable", success: false };
  }

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

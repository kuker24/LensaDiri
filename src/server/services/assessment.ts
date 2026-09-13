import "server-only";

import type { AssessmentSelectionInput } from "@/lib/assessment/catalog";
import { hasAssessmentCandidateCapacity } from "@/lib/assessment/composer";
import {
  identityJourneyDeepQuota,
  identityJourneyModuleKeys,
  identityJourneyScoringVersions,
  identityJourneyStandardQuota,
} from "@/lib/assessment/identity-journey";
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
import { isJourneyAttachedResultHash } from "@/server/repositories/identity-journeys";

export type LegacyStartRequest = Readonly<{
  kind: "legacy";
  mode: "quick" | "standard";
}>;

export type ModularStartRequest = Readonly<{
  journey?:
    | Readonly<{
        characterGender: "perempuan" | "laki";
        /** All five lenses run in one Complex sitting instead of five sessions. */
        combined?: boolean;
        journeyTokenHash: string;
        kind: "create";
      }>
    | Readonly<{ journeyTokenHash: string; kind: "continue" }>;
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

type ModularAssessmentContext = Readonly<{
  candidates: Awaited<ReturnType<typeof loadComposerCandidates>>;
  combos: Awaited<ReturnType<typeof listComboPresets>>;
  modeProfiles: Awaited<ReturnType<typeof listAssessmentModeProfiles>>;
  modules: Awaited<ReturnType<typeof listCatalogModules>>;
}>;

async function loadModularAssessmentContext(
  moduleKeys: readonly string[],
  scoringVersions: Readonly<Record<string, string>> = {},
): Promise<ModularAssessmentContext> {
  const [modules, combos, modeProfiles, candidates] = await Promise.all([
    listCatalogModules(),
    listComboPresets(),
    listAssessmentModeProfiles(),
    loadComposerCandidates(moduleKeys, scoringVersions),
  ]);
  return { candidates, combos, modeProfiles, modules };
}

/**
 * Product boundary for the identity-journey cutover: only results attached to a
 * journey step are readable. Legacy and pre-cutover modular rows stay in the
 * database for backup, audit, and export-before-deletion operations, but they
 * are no longer served to clients.
 */
export async function getJourneyResultByHash(
  resultTokenHash: string,
): Promise<PrivateResultView | null> {
  if (!(await isJourneyAttachedResultHash(resultTokenHash))) return null;
  return getResultByHash(resultTokenHash);
}

export async function getPrivateResultByToken(token: string): Promise<PrivateResultView | null> {
  if (!opaqueTokenSchema.safeParse(token).success) return null;

  const environment = getServerEnvironment();
  return getJourneyResultByHash(hashOpaqueToken(token, environment.tokenHashPepper));
}

/**
 * Data-rights reader, intentionally NOT gated by the identity-journey cutover.
 * Export and deletion must stay reachable for every stored result, including
 * legacy and pre-cutover modular rows, so the cutover never traps a user's own
 * data. Reporting surfaces must keep using `getPrivateResultByToken`.
 */
export async function getResultForDataRightsByToken(
  token: string,
): Promise<PrivateResultView | null> {
  if (!opaqueTokenSchema.safeParse(token).success) return null;

  const environment = getServerEnvironment();
  return getResultByHash(hashOpaqueToken(token, environment.tokenHashPepper));
}

export async function startAssessment(
  input: {
    accountId: string | null;
    consentVersion: string;
    expiresAt: Date;
    request: StartAssessmentRequest;
    sessionTokenHash: string;
  },
  options: {
    loadModularContext?: (
      moduleKeys: readonly string[],
      scoringVersions?: Readonly<Record<string, string>>,
    ) => Promise<ModularAssessmentContext>;
  } = {},
): Promise<StartAssessmentResult> {
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

  if (input.request.journey?.kind === "create") {
    const selection = input.request.selection;
    // A combined journey is the whole fixed plan in one Complex sitting: exactly
    // the five planned lenses, in plan order, nothing added or dropped. A
    // sequential journey still enters through its single required first lens.
    const expected = input.request.journey.combined
      ? { keys: identityJourneyModuleKeys, mode: "deep", selectionType: "custom_combo" }
      : { keys: ["type_16"], mode: "standard", selectionType: "single" };
    const sameKeys =
      selection.moduleKeys.length === expected.keys.length &&
      expected.keys.every((key, position) => selection.moduleKeys[position] === key);
    if (
      selection.mode !== expected.mode ||
      selection.selectionType !== expected.selectionType ||
      !sameKeys
    ) {
      return { code: "selection_type_mismatch", success: false };
    }
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
  // A combined create runs the same five journey lenses as a sequential run, so
  // it must resolve the same pinned experimental item banks. Only a non-journey
  // start falls back to the default catalog versions.
  const usesJourneyVersions =
    input.request.journey?.kind === "continue" ||
    (input.request.journey?.kind === "create" && input.request.journey.combined === true);
  const journeyScoringVersions = usesJourneyVersions ? identityJourneyScoringVersions : {};
  const loadContext = options.loadModularContext ?? loadModularAssessmentContext;
  const { modules, combos, modeProfiles, candidates } =
    Object.keys(journeyScoringVersions).length > 0
      ? await loadContext(input.request.selection.moduleKeys, journeyScoringVersions)
      : await loadContext(input.request.selection.moduleKeys);
  // Journey lenses use their own versioned item banks, so estimation must read the
  // quota those versions ship instead of the default catalog quota. A combined run
  // is Complex, so it reads the deep quota of the same versions.
  const estimateModules = usesJourneyVersions
    ? modules.map((module) => {
        const key = module.key as keyof typeof identityJourneyStandardQuota;
        const standard = identityJourneyStandardQuota[key];
        const deep = identityJourneyDeepQuota[key];
        if (standard === undefined || deep === undefined) return module;
        return { ...module, modeQuota: { ...module.modeQuota, deep, standard } };
      })
    : modules;
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
  const estimate = estimateAssessment(
    input.request.selection,
    estimateModules,
    combos,
    availableModes,
    {
      minimumCoverage: getMinimumModuleCoverage(candidates, input.request.selection.mode),
      provisionalPrecisionEnabled: flags.FEATURE_PROVISIONAL_PRECISION === true,
    },
  );
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
  const journey =
    input.request.journey?.kind === "create"
      ? {
          characterGender: input.request.journey.characterGender,
          combined: input.request.journey.combined === true,
          journeyTokenHash: input.request.journey.journeyTokenHash,
        }
      : input.request.journey?.kind === "continue"
        ? {
            accountId: input.accountId,
            existingJourneyTokenHash: input.request.journey.journeyTokenHash,
            moduleKey: input.request.selection.moduleKeys[0] ?? "",
          }
        : null;
  await persistModularSession({
    accountId: input.accountId,
    blueprint,
    consentVersion: input.consentVersion,
    expiresAt: input.expiresAt,
    sessionTokenHash: input.sessionTokenHash,
    ...(journey ? { journey } : {}),
  });
  return { kind: "modular", success: true };
}

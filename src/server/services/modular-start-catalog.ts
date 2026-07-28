import "server-only";

import type {
  AssessmentModeProfile,
  AssessmentModuleDefinition,
  ComboPresetDefinition,
} from "@/lib/assessment/catalog";
import { isFeatureEnabled } from "@/server/repositories/catalog";
import {
  listAssessmentModeProfilesFromCache,
  listCatalogModulesFromCache,
  listComboPresetsFromCache,
} from "@/server/repositories/catalog-cache";

export type ModularStartCatalog = {
  combos: ComboPresetDefinition[];
  modes: AssessmentModeProfile[];
  modules: AssessmentModuleDefinition[];
};

/**
 * Server-side catalog for /start/modules so the picker is not stuck on a client
 * skeleton when /api/modules is slow or the browser fetch never settles.
 */
export async function loadModularStartCatalog(): Promise<ModularStartCatalog | null> {
  try {
    const [modules, modes, combos, modularEnabled, complexEnabled] = await Promise.all([
      listCatalogModulesFromCache(),
      listAssessmentModeProfilesFromCache(),
      listComboPresetsFromCache(),
      isFeatureEnabled("FEATURE_MODULAR_COMPOSER"),
      isFeatureEnabled("FEATURE_COMPLEX_MODE"),
    ]);

    if (!modularEnabled) {
      return null;
    }

    const publicModes = modes.map((profile) =>
      profile.internalMode === "deep" ? { ...profile, isSelectable: complexEnabled } : profile,
    );

    return {
      combos: complexEnabled ? combos : combos.filter((combo) => combo.recommendedMode !== "deep"),
      modes: publicModes,
      modules,
    };
  } catch {
    return null;
  }
}

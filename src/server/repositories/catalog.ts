import "server-only";

import type {
  AssessmentMode,
  AssessmentModeProfile,
  AssessmentModuleDefinition,
  ComboPresetDefinition,
  EvidenceTier,
  ModuleCategory,
  ReleaseDisposition,
  SelectableModuleStatus,
} from "@/lib/assessment/catalog";
import { unstable_cache } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

// Katalog modul, combo, dan mode profile bersumber dari konten immutable yang
// hanya berubah lewat migration/seed yang direview manual. Cache runtime ini
// menghapus query database berulang per request tanpa memicu prerender
// build-time (halaman katalog tetap force-dynamic, jadi build tidak butuh DB).
const CATALOG_CACHE_TAG = "catalog";
const CATALOG_REVALIDATE_SECONDS = 300;

type CatalogModuleRow = {
  availability_reason: string | null;
  category: ModuleCategory;
  composer_config_json: Partial<Record<AssessmentMode, number>> & {
    deepQuota?: number;
    quickQuota?: number;
    standardQuota?: number;
  };
  default_order: number;
  description: string;
  evidence_tier: EvidenceTier;
  is_experimental: boolean;
  is_selectable: boolean;
  key: string;
  minimum_age: number;
  public_name: string;
  release_disposition: ReleaseDisposition;
  status: AssessmentModuleDefinition["status"];
  version: string | null;
};

type ModeProfileRow = {
  description: string;
  is_selectable: boolean;
  max_items_per_segment: number;
  mode: AssessmentMode;
  provisional_precision_max: number | null;
  provisional_precision_min: number | null;
  public_name: AssessmentModeProfile["publicName"];
  seconds_per_item: number;
  single_module_item_max: number;
  single_module_item_min: number;
  target_item_max: number;
  target_item_min: number;
};

type ComboRow = {
  description: string;
  is_full_spectrum: boolean;
  key: string;
  module_keys: string[];
  public_name: string;
  recommended_mode: AssessmentMode;
  status: ComboPresetDefinition["status"];
};

const visibleStatuses = [
  "active",
  "pilot",
  "published",
  "experimental",
] as const satisfies readonly SelectableModuleStatus[];

function toQuota(row: CatalogModuleRow): AssessmentModuleDefinition["modeQuota"] {
  const quick = row.composer_config_json.quickQuota ?? row.composer_config_json.quick ?? 0;
  const standard =
    row.composer_config_json.standardQuota ?? row.composer_config_json.standard ?? quick;
  const deep = row.composer_config_json.deepQuota ?? row.composer_config_json.deep ?? standard;
  return { deep, quick, standard };
}

function toModule(row: CatalogModuleRow): AssessmentModuleDefinition {
  return {
    availabilityReason: row.availability_reason,
    category: row.category,
    defaultOrder: row.default_order,
    description: row.description,
    evidenceTier: row.evidence_tier,
    isExperimental: row.is_experimental,
    isSelectable: row.is_selectable,
    key: row.key,
    minimumAge: row.minimum_age,
    modeQuota: toQuota(row),
    publicName: row.public_name,
    releaseDisposition: row.release_disposition,
    status: row.status,
    version: row.version,
  };
}

async function listCatalogModulesUncached(
  includeUnavailable: boolean,
): Promise<AssessmentModuleDefinition[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<CatalogModuleRow[]>`
      select
        modules.key,
        modules.public_name,
        modules.description,
        modules.evidence_tier,
        modules.status,
        modules.category,
        modules.is_selectable,
        modules.is_experimental,
        modules.minimum_age,
        modules.default_order,
        modules.release_disposition,
        modules.availability_reason,
        module_versions.version,
        coalesce(module_versions.composer_config_json, '{}'::jsonb) as composer_config_json
      from public.modules
      left join lateral (
        select version, composer_config_json
        from public.module_versions
        where module_versions.module_id = modules.id
          and module_versions.status in ('pilot', 'published', 'experimental', 'active')
        order by module_versions.published_at desc nulls last, module_versions.created_at desc
        limit 1
      ) as module_versions on true
      where ${includeUnavailable}
        or (
          modules.release_disposition = 'RELEASE_READY'
          and modules.is_selectable
          and modules.status in ('active', 'pilot', 'published', 'experimental')
          and module_versions.version is not null
        )
      order by modules.default_order, modules.key
    `;
    return rows.map(toModule);
  });
}

const listCatalogModulesCached = unstable_cache(listCatalogModulesUncached, ["catalog-modules"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: [CATALOG_CACHE_TAG],
});

export async function listCatalogModules(
  options: Readonly<{ includeUnavailable?: boolean }> = {},
): Promise<AssessmentModuleDefinition[]> {
  return listCatalogModulesCached(options.includeUnavailable ?? false);
}

export async function getCatalogModuleByKey(
  key: string,
): Promise<AssessmentModuleDefinition | null> {
  const modules = await listCatalogModules();
  return modules.find((module) => module.key === key) ?? null;
}

async function listAssessmentModeProfilesUncached(): Promise<AssessmentModeProfile[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<ModeProfileRow[]>`
      select
        mode,
        public_name,
        description,
        target_item_min,
        target_item_max,
        single_module_item_min,
        single_module_item_max,
        max_items_per_segment,
        seconds_per_item,
        provisional_precision_min,
        provisional_precision_max,
        is_selectable
      from public.assessment_mode_profiles
      order by array_position(array['quick', 'standard', 'deep']::public.assessment_mode[], mode)
    `;
    return rows.map((row) => ({
      description: row.description,
      internalMode: row.mode,
      isSelectable: row.is_selectable,
      maxItemsPerSegment: row.max_items_per_segment,
      provisionalPrecision:
        row.provisional_precision_min === null || row.provisional_precision_max === null
          ? null
          : { max: row.provisional_precision_max, min: row.provisional_precision_min },
      publicName: row.public_name,
      secondsPerItem: row.seconds_per_item,
      singleModuleItems: {
        max: row.single_module_item_max,
        min: row.single_module_item_min,
      },
      targetItems: { max: row.target_item_max, min: row.target_item_min },
    }));
  });
}

export const listAssessmentModeProfiles = unstable_cache(
  listAssessmentModeProfilesUncached,
  ["catalog-mode-profiles"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] },
);

async function listComboPresetsUncached(
  includeUnavailable: boolean,
): Promise<ComboPresetDefinition[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<ComboRow[]>`
      select
        combo_presets.key,
        combo_presets.public_name,
        combo_presets.description,
        combo_presets.status,
        combo_presets.recommended_mode,
        combo_presets.is_full_spectrum,
        coalesce(
          array_agg(modules.key order by combo_preset_modules.display_order)
            filter (where modules.key is not null),
          array[]::text[]
        ) as module_keys
      from public.combo_presets
      left join public.combo_preset_modules
        on combo_preset_modules.combo_preset_id = combo_presets.id
      left join public.modules on modules.id = combo_preset_modules.module_id
      where ${includeUnavailable}
        or combo_presets.status in ('active', 'pilot', 'published', 'experimental')
      group by combo_presets.id
      order by combo_presets.default_order, combo_presets.key
    `;
    return rows.map((row) => ({
      description: row.description,
      isFullSpectrum: row.is_full_spectrum,
      key: row.key,
      moduleKeys: row.module_keys,
      publicName: row.public_name,
      recommendedMode: row.recommended_mode,
      status: row.status,
    }));
  });
}

const listComboPresetsCached = unstable_cache(listComboPresetsUncached, ["catalog-combo-presets"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: [CATALOG_CACHE_TAG],
});

export async function listComboPresets(
  options: Readonly<{ includeUnavailable?: boolean }> = {},
): Promise<ComboPresetDefinition[]> {
  return listComboPresetsCached(options.includeUnavailable ?? false);
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [row] = await sql<{ enabled: boolean }[]>`
      select enabled from public.feature_flags where key = ${key} limit 1
    `;
    return row?.enabled ?? false;
  });
}

export const catalogVisibleStatuses = visibleStatuses;

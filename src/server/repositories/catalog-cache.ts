import "server-only";

import { unstable_cache } from "next/cache";

import type {
  AssessmentModeProfile,
  AssessmentModuleDefinition,
  ComboPresetDefinition,
} from "@/lib/assessment/catalog";
import {
  getCatalogModuleByKey,
  listAssessmentModeProfiles,
  listCatalogModules,
  listComboPresets,
} from "@/server/repositories/catalog";

// Katalog modul, combo, dan mode profile bersumber dari konten immutable yang
// hanya berubah lewat migration/seed yang direview manual. Wrapper cache ini
// menghapus query database berulang per request untuk halaman publik dan route
// handler katalog.
//
// unstable_cache membutuhkan request context Next.js (AsyncLocalStorage), jadi
// wrapper ini sengaja dipisah dari repository murni di `catalog.ts`. Repository
// tetap bisa dipanggil langsung oleh integration test dan jalur assessment tanpa
// request context. Halaman katalog tetap force-dynamic sehingga cache hanya
// bekerja di runtime dan tidak memicu prerender build-time yang butuh database.
const CATALOG_CACHE_TAG = "catalog";
const CATALOG_REVALIDATE_SECONDS = 300;

const cacheOptions = {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: [CATALOG_CACHE_TAG],
};

const listCatalogModulesCached = unstable_cache(
  (includeUnavailable: boolean) => listCatalogModules({ includeUnavailable }),
  ["catalog-modules"],
  cacheOptions,
);

export function listCatalogModulesFromCache(
  options: Readonly<{ includeUnavailable?: boolean }> = {},
): Promise<AssessmentModuleDefinition[]> {
  return listCatalogModulesCached(options.includeUnavailable ?? false);
}

const getCatalogModuleByKeyCached = unstable_cache(
  (key: string) => getCatalogModuleByKey(key),
  ["catalog-module-by-key"],
  cacheOptions,
);

export function getCatalogModuleByKeyFromCache(
  key: string,
): Promise<AssessmentModuleDefinition | null> {
  return getCatalogModuleByKeyCached(key);
}

export const listAssessmentModeProfilesFromCache = unstable_cache(
  (): Promise<AssessmentModeProfile[]> => listAssessmentModeProfiles(),
  ["catalog-mode-profiles"],
  cacheOptions,
);

const listComboPresetsCached = unstable_cache(
  (includeUnavailable: boolean) => listComboPresets({ includeUnavailable }),
  ["catalog-combo-presets"],
  cacheOptions,
);

export function listComboPresetsFromCache(
  options: Readonly<{ includeUnavailable?: boolean }> = {},
): Promise<ComboPresetDefinition[]> {
  return listComboPresetsCached(options.includeUnavailable ?? false);
}

export { isFeatureEnabledBatch } from "./catalog";

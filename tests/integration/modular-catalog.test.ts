import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import {
  getCatalogModuleByKey,
  isFeatureEnabled,
  listAssessmentModeProfiles,
  listCatalogModules,
  listComboPresets,
} from "@/server/repositories/catalog";

afterAll(async () => closeDatabaseForTests());

describe("modular catalog PostgreSQL boundary", () => {
  it("stores canonical catalog while exposing only functional modules", async () => {
    const sql = getDatabase();
    const [counts] = await sql<
      { modules: number; modes: number; presets: number; selectable: number }[]
    >`
      select
        (select count(*)::integer from public.modules) as modules,
        (select count(*)::integer from public.assessment_mode_profiles) as modes,
        (select count(*)::integer from public.combo_presets) as presets,
        (select count(*)::integer from public.modules where is_selectable) as selectable
    `;
    expect(counts).toEqual({ modules: 10, modes: 3, presets: 6, selectable: 4 });

    const modules = await listCatalogModules();
    expect(modules).toHaveLength(4);
    expect(modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceTier: "A",
          isSelectable: true,
          key: "trait_profile",
          modeQuota: { deep: 60, quick: 40, standard: 60 },
          version: "modular-1",
        }),
        expect.objectContaining({
          key: "type_16",
          modeQuota: { deep: 48, quick: 32, standard: 40 },
          version: "1.0.0",
        }),
        expect.objectContaining({ key: "enneagram", version: "1.0.0" }),
        expect.objectContaining({ key: "temperament", version: "1.0.0" }),
      ]),
    );
    await expect(getCatalogModuleByKey("type_16")).resolves.toMatchObject({
      key: "type_16",
      version: "1.0.0",
    });
    await expect(getCatalogModuleByKey("riasec")).resolves.toBeNull();
  });

  it("maps Quick/Normal/Complex and keeps incomplete presets hidden", async () => {
    await expect(listAssessmentModeProfiles()).resolves.toMatchObject([
      { internalMode: "quick", publicName: "Quick" },
      { internalMode: "standard", publicName: "Normal" },
      { internalMode: "deep", isSelectable: false, publicName: "Complex" },
    ]);
    await expect(listComboPresets()).resolves.toEqual([]);
    await expect(listComboPresets({ includeUnavailable: true })).resolves.toHaveLength(6);
  });

  it("defaults all experimental rollout flags off", async () => {
    await expect(isFeatureEnabled("FEATURE_MODULAR_COMPOSER")).resolves.toBe(false);
    await expect(isFeatureEnabled("FEATURE_COMPLEX_MODE")).resolves.toBe(false);
    await expect(isFeatureEnabled("FEATURE_PROVISIONAL_PRECISION")).resolves.toBe(false);
    await expect(isFeatureEnabled("FEATURE_AI_NARRATIVE")).resolves.toBe(false);
    await expect(isFeatureEnabled("FEATURE_UNKNOWN")).resolves.toBe(false);
  });
});

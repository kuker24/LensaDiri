import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const flags = vi.hoisted(() => new Map<string, boolean>());

vi.mock("@/server/repositories/catalog", () => ({
  isFeatureEnabled: (key: string) => Promise.resolve(flags.get(key) ?? false),
}));

vi.mock("@/server/repositories/catalog-cache", () => ({
  listAssessmentModeProfilesFromCache: () => Promise.resolve([]),
  listCatalogModulesFromCache: () => Promise.resolve([]),
  listComboPresetsFromCache: () =>
    Promise.resolve([
      {
        description: "Normal preset",
        isFullSpectrum: false,
        key: "normal_preset",
        moduleKeys: ["trait_profile", "type_16"],
        publicName: "Normal preset",
        recommendedMode: "standard",
        status: "published",
      },
      {
        description: "Complex preset",
        isFullSpectrum: false,
        key: "complex_preset",
        moduleKeys: ["trait_profile", "type_16"],
        publicName: "Complex preset",
        recommendedMode: "deep",
        status: "pilot",
      },
    ]),
}));

import { GET as getCombos } from "@/app/api/combos/route";
import { GET as getModules } from "@/app/api/modules/route";

beforeEach(() => {
  flags.clear();
});

describe("modular catalog feature gates", () => {
  test("returns feature_unavailable when the modular composer is off", async () => {
    const modules = await getModules();
    const combos = await getCombos();

    expect(modules.status).toBe(404);
    expect(combos.status).toBe(404);
    await expect(modules.json()).resolves.toMatchObject({
      error: { code: "feature_unavailable" },
      success: false,
    });
    await expect(combos.json()).resolves.toMatchObject({
      error: { code: "feature_unavailable" },
      success: false,
    });
  });

  test("hides every Complex preset when Complex is off", async () => {
    flags.set("FEATURE_MODULAR_COMPOSER", true);

    const response = await getCombos();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { combos: [expect.objectContaining({ key: "normal_preset" })] },
      success: true,
    });
  });
});

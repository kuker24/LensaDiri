import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const flags = vi.hoisted(() => new Map<string, boolean>());
const getFlags = vi.hoisted(() => vi.fn());

vi.mock("@/server/repositories/catalog", () => ({
  isFeatureEnabled: (key: string) => Promise.resolve(flags.get(key) ?? false),
}));

vi.mock("@/server/repositories/catalog-cache", () => ({
  isFeatureEnabledBatch: getFlags,
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
  getFlags
    .mockReset()
    .mockImplementation((keys: readonly string[]) =>
      Promise.resolve(
        Object.fromEntries(keys.map((key) => [key, flags.get(key) ?? false])) as Record<
          string,
          boolean
        >,
      ),
    );
});

afterEach(() => {
  vi.useRealTimers();
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
    expect(getFlags).toHaveBeenCalledTimes(1);
    expect(getFlags).toHaveBeenCalledWith(["FEATURE_MODULAR_COMPOSER", "FEATURE_COMPLEX_MODE"]);
  });

  test("returns modules and combos from one catalog request", async () => {
    flags.set("FEATURE_MODULAR_COMPOSER", true);

    const response = await getModules();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        combos: [expect.objectContaining({ key: "normal_preset" })],
        modes: [],
        modules: [],
      },
      success: true,
    });
    expect(getFlags).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["modules", getModules],
    ["combos", getCombos],
  ])("fails %s closed with 503 when catalog reads exceed the deadline", async (_name, get) => {
    vi.useFakeTimers();
    getFlags.mockImplementationOnce(() => new Promise(() => undefined));

    const responsePromise = get();
    await vi.advanceTimersByTimeAsync(6_000);
    const response = await responsePromise;

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: { code: "service_unavailable" },
      success: false,
    });
  });
});

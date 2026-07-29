import { beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  loadCandidates: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (load: (...args: never[]) => unknown) => load,
}));

vi.mock("@/server/repositories/catalog", () => ({
  getCatalogModuleByKey: vi.fn(),
  isFeatureEnabledBatch: vi.fn(),
  listAssessmentModeProfiles: vi.fn(),
  listCatalogModules: vi.fn(),
  listComboPresets: vi.fn(),
}));

vi.mock("@/server/repositories/blueprints", () => ({
  loadComposerCandidates: mocks.loadCandidates,
}));

import { loadComposerCandidatesFromCache } from "@/server/repositories/catalog-cache";

beforeEach(() => {
  mocks.loadCandidates.mockReset().mockResolvedValue([]);
});

test("normalizes composer candidate cache keys", async () => {
  await loadComposerCandidatesFromCache(["type_16", "trait_profile", "type_16"]);

  expect(mocks.loadCandidates).toHaveBeenCalledOnce();
  expect(mocks.loadCandidates).toHaveBeenCalledWith(["trait_profile", "type_16"]);
});

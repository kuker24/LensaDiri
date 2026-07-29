import { beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  compose: vi.fn(),
  estimate: vi.fn(),
  flags: vi.fn(),
  persist: vi.fn(),
}));

vi.mock("@/lib/assessment/composer", () => ({
  hasAssessmentCandidateCapacity: () => true,
}));

vi.mock("@/lib/assessment/estimate", () => ({
  estimateAssessment: mocks.estimate,
}));

vi.mock("@/server/repositories/blueprints", () => ({
  composeFromDatabase: mocks.compose,
  getMinimumModuleCoverage: () => ({}),
  persistModularSession: mocks.persist,
}));

vi.mock("@/server/repositories/catalog", () => ({
  isFeatureEnabledBatch: mocks.flags,
  listAssessmentModeProfiles: vi.fn(),
  listCatalogModules: vi.fn(),
  listComboPresets: vi.fn(),
}));

vi.mock("@/server/repositories/assessment", () => ({
  createAssessmentSession: vi.fn(),
  getResultByHash: vi.fn(),
}));

import { startAssessment } from "@/server/services/assessment";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.flags.mockResolvedValue({
    FEATURE_COMPLEX_MODE: true,
    FEATURE_MODULAR_COMPOSER: true,
    FEATURE_PROVISIONAL_PRECISION: true,
  });
  mocks.estimate.mockReturnValue({
    estimate: {
      disclaimer: "Reflektif.",
      estimatedMinutes: 5,
      itemCount: 24,
      mode: "quick",
      moduleAllocation: [{ itemCount: 24, moduleKey: "riasec" }],
      precision: null,
      publicMode: "Quick",
      segmentPlan: [{ itemCount: 24, segmentIndex: 1 }],
      selectionType: "single",
    },
    success: true,
  });
  mocks.compose.mockResolvedValue({});
  mocks.persist.mockResolvedValue({ blueprintId: "blueprint-id", sessionId: "session-id" });
});

test("starts once from cached immutable assessment context", async () => {
  const loadModularContext = vi.fn().mockResolvedValue({
    candidates: [],
    combos: [],
    modeProfiles: [],
    modules: [],
  });
  const result = await startAssessment(
    {
      accountId: null,
      consentVersion: "prd-v2-1",
      expiresAt: new Date("2026-08-05T00:00:00.000Z"),
      request: {
        kind: "modular",
        locale: "id",
        selection: {
          age: 18,
          experimentalAcknowledged: false,
          mode: "quick",
          moduleKeys: ["riasec"],
          presetKey: null,
          selectionType: "single",
        },
      },
      sessionTokenHash: "a".repeat(64),
    },
    { loadModularContext },
  );

  expect(result).toEqual({ kind: "modular", success: true });
  expect(loadModularContext).toHaveBeenCalledWith(["riasec"]);
  expect(mocks.persist).toHaveBeenCalledOnce();
});

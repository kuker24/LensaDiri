import { beforeEach, describe, expect, it, vi } from "vitest";

import { DatabaseError, mapDatabaseError } from "@/lib/db/errors";
import { getDatabaseFailureStatus } from "@/server/http";

// Mocking dependencies for route tests
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/env", () => ({
  getServerEnvironment: () => ({
    appOrigin: "http://localhost:3000",
    csrfSecret: "test-csrf-secret-at-least-32-chars-long",
    isProduction: false,
    rateLimitSecret: "test-rate-limit-secret-at-least-32-chars-long",
    tokenHashPepper: "test-pepper-at-least-32-chars-long",
  }),
}));

vi.mock("@/lib/security/csrf", () => ({
  isValidCsrfMutation: () => true,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  getRequestRateLimitIdentity: () => "127.0.0.1",
}));

const mockConsumeRateLimit = vi.fn();
vi.mock("@/server/services/rate-limiter", () => ({
  assessmentRateLimitPolicies: {
    estimate: { limit: 60, routeKey: "assessment_estimate", windowMs: 900000 },
    start: { limit: 10, routeKey: "assessment_start", windowMs: 3600000 },
  },
  consumeRateLimit: (...args: unknown[]) =>
    (mockConsumeRateLimit as (...args: unknown[]) => unknown)(...args),
}));

// Mock repositories & catalog cache that routes might hit on success path (to isolate failures)
vi.mock("@/server/repositories/catalog", () => ({
  isFeatureEnabled: () => Promise.resolve(true),
  listCatalogModules: () => Promise.resolve([]),
  listComboPresets: () => Promise.resolve([]),
  listAssessmentModeProfiles: () => Promise.resolve([]),
}));

const mockModule = {
  category: "career",
  defaultOrder: 50,
  description: "RIASEC",
  evidenceTier: "B",
  isExperimental: false,
  isSelectable: true,
  key: "riasec",
  minimumAge: 15,
  modeQuota: { deep: 50, quick: 20, standard: 35 },
  publicName: "RIASEC",
  releaseDisposition: "RELEASE_READY",
  status: "published",
  version: "1.0.0",
};

const mockMode = {
  description: "Quick",
  internalMode: "quick",
  isSelectable: true,
  maxItemsPerSegment: 120,
  provisionalPrecision: null,
  publicName: "Quick",
  secondsPerItem: 12,
  singleModuleItems: { max: 40, min: 20 },
  targetItems: { max: 60, min: 50 },
};

vi.mock("@/server/repositories/catalog-cache", () => ({
  isFeatureEnabledBatch: () =>
    Promise.resolve({
      FEATURE_COMPLEX_MODE: true,
      FEATURE_MODULAR_COMPOSER: true,
      FEATURE_PROVISIONAL_PRECISION: true,
    }),
  listAssessmentModeProfilesFromCache: () => Promise.resolve([mockMode]),
  listCatalogModulesFromCache: () => Promise.resolve([mockModule]),
  listComboPresetsFromCache: () => Promise.resolve([]),
}));

vi.mock("@/server/repositories/blueprints", () => ({
  getMinimumModuleCoverage: () => ({}),
  loadComposerCandidates: () => Promise.resolve([]),
}));

const mockStartAssessment = vi.fn();
vi.mock("@/server/services/assessment", () => ({
  startAssessment: (...args: unknown[]) => mockStartAssessment(...args),
}));

vi.mock("@/server/current-session", () => ({
  getCurrentSession: () => Promise.resolve(null),
}));

vi.mock("@/lib/security/tokens", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/security/tokens")>();
  return {
    ...actual,
    generateOpaqueToken: () => "a".repeat(43),
    hashOpaqueToken: () => "b".repeat(64),
  };
});

// Imports of the POST routes for testing
import { POST as estimatePost } from "@/app/api/assessment/estimate/route";
import { POST as startPost } from "@/app/api/assessment/start/route";

describe("rate limiter DB timeout and lock safety mapping", () => {
  beforeEach(() => {
    mockConsumeRateLimit.mockReset();
    mockStartAssessment.mockReset();
  });

  it("maps Postgres query_canceled (57014) to DatabaseError('unavailable')", () => {
    const pgError = { name: "PostgresError", code: "57014" };
    const mapped = mapDatabaseError(pgError);
    expect(mapped).toBeInstanceOf(DatabaseError);
    expect(mapped.kind).toBe("unavailable");
    expect(getDatabaseFailureStatus(mapped)).toBe(503);
  });

  it("maps Postgres lock_not_available (55P03) to DatabaseError('unavailable')", () => {
    const pgError = { name: "PostgresError", code: "55P03" };
    const mapped = mapDatabaseError(pgError);
    expect(mapped).toBeInstanceOf(DatabaseError);
    expect(mapped.kind).toBe("unavailable");
    expect(getDatabaseFailureStatus(mapped)).toBe(503);
  });

  it("fail-opens estimate API when rate limiter times out so preview stays available", async () => {
    mockConsumeRateLimit.mockRejectedValueOnce(new DatabaseError("unavailable"));

    const request = new Request("http://localhost:3000/api/assessment/estimate", {
      body: JSON.stringify({
        age: 18,
        experimentalAcknowledged: false,
        mode: "quick",
        moduleKeys: ["riasec"],
        presetKey: null,
        selectionType: "single",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const response = await estimatePost(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.itemCount).toBeGreaterThan(0);
  });

  it("fail-opens start API when rate limiter times out so legitimate starts are not blocked", async () => {
    mockConsumeRateLimit.mockRejectedValueOnce(new DatabaseError("unavailable"));
    mockStartAssessment.mockResolvedValueOnce({ kind: "modular", success: true });

    const request = new Request("http://localhost:3000/api/assessment/start", {
      body: JSON.stringify({
        age: 18,
        consent: true,
        experimentalAcknowledged: false,
        locale: "id",
        mode: "quick",
        moduleKeys: ["riasec"],
        presetKey: null,
        selectionType: "single",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const response = await startPost(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { flow: "modular", token: "a".repeat(43) },
    });
    expect(mockStartAssessment).toHaveBeenCalledOnce();
  });
});

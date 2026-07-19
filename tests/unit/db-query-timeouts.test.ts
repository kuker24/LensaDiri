import { describe, expect, it, vi, beforeEach } from "vitest";
import { DatabaseTimeoutError, withDeadline } from "@/lib/async/with-deadline";

// Mock server-only to allow importing server files in unit tests
vi.mock("server-only", () => ({}));

// Mock environment variables
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

// Mock rate limiter to always allow requests by default
vi.mock("@/server/services/rate-limiter", () => ({
  assessmentRateLimitPolicies: {
    estimate: { limit: 60, routeKey: "assessment_estimate", windowMs: 900000 },
    start: { limit: 10, routeKey: "assessment_start", windowMs: 3600000 },
  },
  consumeRateLimit: () => Promise.resolve({ allowed: true, retryAfterSeconds: 0 }),
}));

vi.mock("@/server/current-session", () => ({
  getCurrentSession: () => Promise.resolve(null),
}));

// Setup dynamic mocks for catalog repository to simulate timeout
const mockListCatalogModules = vi.fn();
const mockListComboPresets = vi.fn();
const mockListAssessmentModeProfiles = vi.fn();
const mockIsFeatureEnabled = vi.fn();
const mockIsFeatureEnabledBatch = vi.fn();

vi.mock("@/server/repositories/catalog", () => ({
  isFeatureEnabled: (...args: unknown[]) => mockIsFeatureEnabled(...args),
  listAssessmentModeProfiles: () => mockListAssessmentModeProfiles(),
  listCatalogModules: () => mockListCatalogModules(),
  listComboPresets: () => mockListComboPresets(),
}));

vi.mock("@/server/repositories/catalog-cache", () => ({
  isFeatureEnabledBatch: (...args: unknown[]) => mockIsFeatureEnabledBatch(...args),
  listAssessmentModeProfilesFromCache: () => mockListAssessmentModeProfiles(),
  listCatalogModulesFromCache: () => mockListCatalogModules(),
  listComboPresetsFromCache: () => mockListComboPresets(),
}));

vi.mock("@/server/repositories/blueprints", () => ({
  loadComposerCandidates: () => Promise.resolve([]),
  getMinimumModuleCoverage: () => ({}),
}));

// Import routes after mocking
import { POST as estimatePost } from "@/app/api/assessment/estimate/route";
import { POST as startPost } from "@/app/api/assessment/start/route";

describe("withDeadline helper", () => {
  it("resolves normal operation within deadline and clears its timer", async () => {
    vi.useFakeTimers();
    const operation = Promise.resolve("success");
    const result = await withDeadline(operation, 100);
    expect(result).toBe("success");
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("rejects with DatabaseTimeoutError when operation exceeds deadline", async () => {
    vi.useFakeTimers();
    const operation = new Promise<string>(() => undefined);
    const result = withDeadline(operation, 50);
    const rejection = expect(result).rejects.toThrow(DatabaseTimeoutError);
    await vi.advanceTimersByTimeAsync(50);
    await rejection;
    vi.useRealTimers();
  });

  it("safely consumes a late underlying rejection after the deadline", async () => {
    vi.useFakeTimers();
    let rejectUnderlying!: (error: Error) => void;
    const operation = new Promise<string>((_resolve, reject) => {
      rejectUnderlying = reject;
    });
    const result = withDeadline(operation, 50);
    const rejection = expect(result).rejects.toThrow(DatabaseTimeoutError);

    await vi.advanceTimersByTimeAsync(50);
    await rejection;
    rejectUnderlying(new Error("late private database error"));
    await Promise.resolve();
    vi.useRealTimers();
  });
});

describe("Estimate Route - Database query timeout reliability", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIsFeatureEnabled.mockResolvedValue(true);
    mockIsFeatureEnabledBatch.mockResolvedValue({
      FEATURE_MODULAR_COMPOSER: true,
      FEATURE_PROVISIONAL_PRECISION: true,
      FEATURE_COMPLEX_MODE: true,
    });
    mockListCatalogModules.mockResolvedValue([]);
    mockListComboPresets.mockResolvedValue([]);
    mockListAssessmentModeProfiles.mockResolvedValue([]);
    vi.useRealTimers();
  });

  it("returns 503 service_temporarily_busy when catalog loading times out", async () => {
    vi.useFakeTimers();
    // Force catalog loading to stall indefinitely to trigger the route-level 5s deadline
    mockListCatalogModules.mockImplementationOnce(() => new Promise(() => {}));

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

    const responsePromise = estimatePost(request);
    await vi.advanceTimersByTimeAsync(5000);

    const response = await responsePromise;
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: { code: "service_temporarily_busy" },
      message: "Sistem sedang sibuk. Coba lagi beberapa saat.",
    });
  });
});

describe("Start Route - Database query timeout reliability", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockIsFeatureEnabled.mockResolvedValue(true);
    mockListCatalogModules.mockResolvedValue([]);
    mockListComboPresets.mockResolvedValue([]);
    mockListAssessmentModeProfiles.mockResolvedValue([]);
    vi.useRealTimers();
  });

  it("returns 503 assessment_service_busy when start assessment flow times out", async () => {
    vi.useFakeTimers();
    // Force feature flag lookup to stall indefinitely to trigger start route deadline
    mockIsFeatureEnabled.mockImplementationOnce(() => new Promise(() => {}));

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

    const responsePromise = startPost(request);
    await vi.advanceTimersByTimeAsync(8000);

    const response = await responsePromise;
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: { code: "assessment_service_busy" },
      message: "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
    });
  });
});

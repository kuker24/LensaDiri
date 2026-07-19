import { describe, expect, it, vi } from "vitest";

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

// Imports of the POST routes for testing
import { POST as estimatePost } from "@/app/api/assessment/estimate/route";
import { POST as startPost } from "@/app/api/assessment/start/route";

describe("rate limiter DB timeout and lock safety mapping", () => {
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

  it("gracefully returns service_temporarily_busy for estimate API on rate limiter timeout", async () => {
    // Simulate query cancellation / unavailable error during consumeRateLimit
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
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: { code: "service_temporarily_busy" },
      message: "Sistem sedang sibuk. Coba lagi beberapa saat.",
    });
  });

  it("fail-closed with rate_limit_unavailable for start API on rate limiter timeout", async () => {
    // Simulate query cancellation / unavailable error during consumeRateLimit
    mockConsumeRateLimit.mockRejectedValueOnce(new DatabaseError("unavailable"));

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
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: { code: "rate_limit_unavailable" },
      message: "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  registerAccount: vi.fn(),
  consumeRateLimit: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/env", () => ({
  getServerEnvironment: () => ({
    appOrigin: "http://localhost:3000",
    csrfSecret: "test-csrf-secret-at-least-32-chars-long",
    isProduction: false,
    rateLimitSecret: "test-rate-limit-secret-at-least-32-chars-long",
  }),
}));

vi.mock("@/lib/security/csrf", () => ({
  isValidCsrfMutation: () => true,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  getRequestRateLimitIdentity: () => "127.0.0.1",
}));

vi.mock("@/server/services/auth", () => ({
  registerAccount: mocks.registerAccount,
}));

vi.mock("@/server/services/rate-limiter", () => ({
  authRateLimitPolicies: {
    register: { limit: 3, routeKey: "auth_register", windowMs: 3600000 },
  },
  consumeRateLimit: mocks.consumeRateLimit,
}));

import { POST } from "@/app/api/auth/register/route";
import { DatabaseError } from "@/lib/db/errors";

describe("POST /api/auth/register - User Registration Boundary", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.registerAccount.mockReset();
    mocks.consumeRateLimit.mockReset();
  });

  it("returns 202 registration_accepted on successful registration", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.registerAccount.mockResolvedValue({ created: true });

    const request = new Request("http://localhost:3000/api/auth/register", {
      body: JSON.stringify({
        email: "newuser@example.com",
        password: "qa-auth-seq-1234567890!",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(202);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { status: "registration_accepted" },
    });
  });

  it("returns 202 registration_accepted on conflict (duplicate email) to prevent account enumeration", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.registerAccount.mockResolvedValue({ created: false });

    const request = new Request("http://localhost:3000/api/auth/register", {
      body: JSON.stringify({
        email: "duplicateuser@example.com",
        password: "qa-auth-seq-1234567890!",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(202);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { status: "registration_accepted" },
    });
  });

  it("returns 429 rate_limited when registration rate limit is exceeded", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 300 });

    const request = new Request("http://localhost:3000/api/auth/register", {
      body: JSON.stringify({
        email: "spamuser@example.com",
        password: "qa-auth-seq-1234567890!",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("300");

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("rate_limited");
    expect(mocks.registerAccount).not.toHaveBeenCalled();
  });

  it("returns 503 service_unavailable when database timeout occurs", async () => {
    vi.useFakeTimers();
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });

    // Stalls to trigger route deadline timeout (5000ms)
    mocks.registerAccount.mockImplementationOnce(() => new Promise(() => {}));

    const request = new Request("http://localhost:3000/api/auth/register", {
      body: JSON.stringify({
        email: "timeoutuser@example.com",
        password: "qa-auth-seq-1234567890!",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const responsePromise = POST(request);
    await vi.advanceTimersByTimeAsync(5000);

    const response = await responsePromise;
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: { code: "service_unavailable" },
    });

    vi.useRealTimers();
  });

  it("returns 503 service_unavailable when database experiences generic unavailable errors", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.registerAccount.mockRejectedValue(new DatabaseError("unavailable"));

    const request = new Request("http://localhost:3000/api/auth/register", {
      body: JSON.stringify({
        email: "erroruser@example.com",
        password: "qa-auth-seq-1234567890!",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: { code: "service_unavailable" },
    });
  });
});

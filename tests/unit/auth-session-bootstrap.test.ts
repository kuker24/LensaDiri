import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  consumeRateLimit: vi.fn(),
}));

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

vi.mock("@/server/services/auth", () => ({
  getActiveSession: mocks.getActiveSession,
}));

vi.mock("@/server/services/rate-limiter", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  authRateLimitPolicies: {
    session: { limit: 300, routeKey: "auth_session", windowMs: 900000 },
  },
}));

import { GET } from "@/app/api/auth/session/route";
import { DatabaseError } from "@/lib/db/errors";

describe("GET /api/auth/session - Anonymous CSRF/Session bootstrap & auth token verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.getActiveSession.mockReset();
    mocks.consumeRateLimit.mockReset();
  });

  it("returns anonymous false and CSRF token when no cookie is present, without querying DB", async () => {
    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: {},
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.authenticated).toBe(false);
    expect(body.data.csrfToken).toBeTypeOf("string");

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("lensadiri_csrf=");

    // DB and rate-limit calls are avoided on anonymous bootstrap
    expect(mocks.getActiveSession).not.toHaveBeenCalled();
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
  });

  it("returns anonymous false, sets CSRF token, and clears invalid session cookie when token is invalid format, without querying DB", async () => {
    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        cookie: "lensadiri_session=badformat",
      },
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.authenticated).toBe(false);
    expect(body.data.csrfToken).toBeTypeOf("string");

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("lensadiri_csrf=");
    expect(setCookie).toContain("lensadiri_session=;");

    // DB and rate-limit calls are avoided when token format is invalid
    expect(mocks.getActiveSession).not.toHaveBeenCalled();
    expect(mocks.consumeRateLimit).not.toHaveBeenCalled();
  });

  it("returns authenticated true when valid session token exists and is active, performing session DB query and rate limit check", async () => {
    const validToken = "a".repeat(43);
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getActiveSession.mockResolvedValue({
      accountId: "acc-id",
      accountStatus: "active",
      expiresAt: new Date(Date.now() + 60000),
      revokedAt: null,
      sessionId: "sess-id",
    });

    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        cookie: `lensadiri_session=${validToken}`,
      },
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.authenticated).toBe(true);

    expect(mocks.consumeRateLimit).toHaveBeenCalledOnce();
    expect(mocks.getActiveSession).toHaveBeenCalledOnce();
    expect(mocks.getActiveSession).toHaveBeenCalledWith(
      validToken,
      "test-pepper-at-least-32-chars-long",
    );
  });

  it("fails closed with 503 service_unavailable and hides system errors when DB fails during active session lookup", async () => {
    const validToken = "b".repeat(43);
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.getActiveSession.mockRejectedValue(new DatabaseError("unavailable"));

    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        cookie: `lensadiri_session=${validToken}`,
      },
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("service_unavailable");
    expect(body.error.message).toBeUndefined();
  });

  it("fails closed with 503 service_unavailable when active session lookup times out", async () => {
    vi.useFakeTimers();
    const validToken = "c".repeat(43);
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });

    // Stalls indefinitely to trigger withDeadline (3000ms)
    mocks.getActiveSession.mockImplementationOnce(() => new Promise(() => {}));

    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        cookie: `lensadiri_session=${validToken}`,
      },
      method: "GET",
    });

    const responsePromise = GET(request);
    await vi.advanceTimersByTimeAsync(3000);

    const response = await responsePromise;
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("service_unavailable");
    expect(body.error.message).toBeUndefined();
    vi.useRealTimers();
  });

  it("rejects with 429 rate_limited when session rate limit is exceeded for a valid token", async () => {
    const validToken = "d".repeat(43);
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 123 });

    const request = new Request("http://localhost:3000/api/auth/session", {
      headers: {
        cookie: `lensadiri_session=${validToken}`,
      },
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(429);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("rate_limited");
    expect(response.headers.get("Retry-After")).toBe("123");

    expect(mocks.consumeRateLimit).toHaveBeenCalledOnce();
    // Active session must NOT be queried when rate-limited
    expect(mocks.getActiveSession).not.toHaveBeenCalled();
  });
});

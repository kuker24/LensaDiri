import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cleanupExpiredRetentionData: vi.fn(),
  previewExpiredRetentionData: vi.fn(),
  cronSecret: "cron-secret-at-least-16-chars" as string | null,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/env", () => ({
  getServerEnvironment: () => ({ cronSecret: mocks.cronSecret, isProduction: false }),
}));

vi.mock("@/server/repositories/retention", () => ({
  cleanupExpiredRetentionData: mocks.cleanupExpiredRetentionData,
  previewExpiredRetentionData: mocks.previewExpiredRetentionData,
}));

import { GET } from "@/app/api/cron/retention-cleanup/route";
import { DatabaseError } from "@/lib/db/errors";

const url = "http://localhost:3000/api/cron/retention-cleanup";

function request(init: { auth?: string; dryRun?: boolean } = {}): Request {
  const target = init.dryRun ? `${url}?dryRun=1` : url;
  return new Request(target, {
    headers: init.auth ? { authorization: init.auth } : {},
    method: "GET",
  });
}

describe("GET /api/cron/retention-cleanup", () => {
  beforeEach(() => {
    mocks.cronSecret = "cron-secret-at-least-16-chars";
    mocks.cleanupExpiredRetentionData.mockReset();
    mocks.previewExpiredRetentionData.mockReset();
  });

  it("returns 401 without an authorization header", async () => {
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mocks.cleanupExpiredRetentionData).not.toHaveBeenCalled();
  });

  it("returns 401 for a wrong bearer token", async () => {
    const response = await GET(request({ auth: "Bearer wrong-token-value-1234567" }));
    expect(response.status).toBe(401);
    expect(mocks.cleanupExpiredRetentionData).not.toHaveBeenCalled();
  });

  it("fails closed with 401 when no cron secret is configured", async () => {
    mocks.cronSecret = null;
    const response = await GET(request({ auth: "Bearer cron-secret-at-least-16-chars" }));
    expect(response.status).toBe(401);
    expect(mocks.cleanupExpiredRetentionData).not.toHaveBeenCalled();
  });

  it("runs the real cleanup for an authorized request", async () => {
    mocks.cleanupExpiredRetentionData.mockResolvedValue({ guest_sessions: 3, rate_limits: 5 });
    const response = await GET(request({ auth: "Bearer cron-secret-at-least-16-chars" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { dryRun: false, counts: { guest_sessions: 3, rate_limits: 5 } },
    });
    expect(mocks.cleanupExpiredRetentionData).toHaveBeenCalledOnce();
    expect(mocks.previewExpiredRetentionData).not.toHaveBeenCalled();
  });

  it("runs the read-only preview when dryRun=1 without deleting", async () => {
    mocks.previewExpiredRetentionData.mockResolvedValue({ guest_sessions: 2, rate_limits: 0 });
    const response = await GET(
      request({ auth: "Bearer cron-secret-at-least-16-chars", dryRun: true }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.dryRun).toBe(true);
    expect(mocks.previewExpiredRetentionData).toHaveBeenCalledOnce();
    expect(mocks.cleanupExpiredRetentionData).not.toHaveBeenCalled();
  });

  it("returns a safe 503 when the database is unavailable", async () => {
    mocks.cleanupExpiredRetentionData.mockRejectedValue(new DatabaseError("unavailable"));
    const response = await GET(request({ auth: "Bearer cron-secret-at-least-16-chars" }));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: { code: "service_unavailable" } });
  });
});

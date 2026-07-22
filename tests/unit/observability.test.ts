import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { logOperationalEvent } from "@/server/observability";

describe("operational logging", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("emits one structured allowlisted record without caller extras", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "a".repeat(40));
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logOperationalEvent({
      correlationId: "123e4567-e89b-42d3-a456-426614174000",
      durationMs: 12.345,
      operation: "assessment_answer_save",
      status: "success",
      ...({ token: "must-not-appear" } as object),
    });

    expect(info).toHaveBeenCalledOnce();
    const record = JSON.parse(String(info.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(record).toMatchObject({
      correlation_id: "123e4567-e89b-42d3-a456-426614174000",
      deployment_sha: "a".repeat(40),
      duration_ms: 12.35,
      environment: "preview",
      level: "info",
      operation: "assessment_answer_save",
      schema_version: 1,
      status: "success",
      type: "operational_event",
    });
    expect(record).not.toHaveProperty("token");
  });

  it("drops unsafe labels and sends failures to stderr", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logOperationalEvent({
      correlationId: "raw-token-that-is-not-a-uuid",
      errorCode: "database_timeout",
      operation: "assessment_complete",
      status: "failure",
    });

    const record = JSON.parse(String(error.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(record).not.toHaveProperty("correlation_id");
    expect(record).toMatchObject({ error_code: "database_timeout", level: "error" });
  });
});

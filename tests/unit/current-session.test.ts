import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  getActiveSession: vi.fn(),
  logOperationalEvent: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/lib/db/env", () => ({
  getServerEnvironment: () => ({
    isProduction: false,
    tokenHashPepper: "test-pepper-at-least-32-chars-long",
  }),
}));

vi.mock("@/server/services/auth", () => ({
  getActiveSession: mocks.getActiveSession,
}));

vi.mock("@/server/observability", () => ({
  elapsedMilliseconds: () => 4_000,
  logOperationalEvent: mocks.logOperationalEvent,
}));

import { DatabaseError } from "@/lib/db/errors";
import { getCurrentSession } from "@/server/current-session";

describe("getCurrentSession", () => {
  beforeEach(() => {
    vi.useRealTimers();
    mocks.cookies.mockReset();
    mocks.getActiveSession.mockReset();
    mocks.logOperationalEvent.mockReset();
  });

  it("returns null without a valid cookie and skips the database", async () => {
    mocks.cookies.mockResolvedValue({ get: () => undefined });

    await expect(getCurrentSession()).resolves.toBeNull();
    expect(mocks.getActiveSession).not.toHaveBeenCalled();
  });

  it("throws a database failure instead of treating it as logout", async () => {
    mocks.cookies.mockResolvedValue({ get: () => ({ value: "a".repeat(43) }) });
    mocks.getActiveSession.mockRejectedValue(new DatabaseError("unavailable"));

    await expect(getCurrentSession()).rejects.toBeInstanceOf(DatabaseError);

    expect(mocks.logOperationalEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "database_error",
        operation: "current_session",
        status: "error",
      }),
    );
  });
});

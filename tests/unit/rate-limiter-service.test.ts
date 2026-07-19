import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  incrementRateLimit: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/repositories/rate-limits", () => ({
  incrementRateLimit: mocks.incrementRateLimit,
}));

import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

describe("rate limiter service deadline", () => {
  beforeEach(() => {
    mocks.incrementRateLimit.mockReset();
    vi.useRealTimers();
  });

  it("returns a normal rate-limit decision when the database responds", async () => {
    mocks.incrementRateLimit.mockResolvedValue(1);

    await expect(
      consumeRateLimit(
        "test-identity",
        assessmentRateLimitPolicies.estimate,
        "test-rate-limit-secret-at-least-32-characters",
        new Date("2026-07-28T12:00:00.000Z"),
      ),
    ).resolves.toEqual({ allowed: true, retryAfterSeconds: 900 });
  });

  it("fails within the two-second deadline when database acquisition never resolves", async () => {
    vi.useFakeTimers();
    mocks.incrementRateLimit.mockReturnValue(new Promise(() => undefined));

    const decision = consumeRateLimit(
      "stalled-identity",
      assessmentRateLimitPolicies.estimate,
      "test-rate-limit-secret-at-least-32-characters",
      new Date("2026-07-28T12:00:00.000Z"),
    );
    const rejection = expect(decision).rejects.toMatchObject({
      kind: "unavailable",
      message: "Database operation failed.",
    });

    await vi.advanceTimersByTimeAsync(1_999);
    expect(mocks.incrementRateLimit).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    await rejection;
  });
});

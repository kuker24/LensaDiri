import { describe, expect, it } from "vitest";

import {
  getFixedWindow,
  getRequestRateLimitIdentity,
  isRateLimitAllowed,
} from "@/lib/security/rate-limit";

describe("fixed-window rate limit primitives", () => {
  it("uses deterministic minute-aligned buckets and retry duration", () => {
    const now = new Date("2026-07-12T12:34:45.500Z");
    const window = getFixedWindow(15 * 60 * 1_000, now);

    expect(window.windowStart.toISOString()).toBe("2026-07-12T12:30:00.000Z");
    expect(window.retryAfterSeconds).toBe(615);
    expect(isRateLimitAllowed(5, 5)).toBe(true);
    expect(isRateLimitAllowed(6, 5)).toBe(false);
  });

  it("does not trust forwarded addresses unless platform proxy contract is explicit", () => {
    const previousVercel = process.env.VERCEL;
    delete process.env.VERCEL;
    const request = new Request("http://localhost:3000", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });

    expect(getRequestRateLimitIdentity(request)).toBe("unknown");
    process.env.VERCEL = "1";
    expect(getRequestRateLimitIdentity(request)).toBe("203.0.113.9");

    if (previousVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = previousVercel;
    }
  });
});

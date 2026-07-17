import { describe, expect, it } from "vitest";
import {
  deriveOpaqueToken,
  generateOpaqueToken,
  hashOpaqueToken,
  verifyOpaqueToken,
} from "@/lib/security/tokens";

const pepper = "development-only-pepper-value-with-32-plus-chars";

describe("opaque tokens", () => {
  it("generates distinct URL-safe tokens with recommended entropy", () => {
    const first = generateOpaqueToken();
    const second = generateOpaqueToken();

    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/u);
    expect(first.length).toBeGreaterThanOrEqual(43);
  });

  it("derives retry-safe domain-separated opaque tokens", () => {
    expect(deriveOpaqueToken("session-token", "assessment_result", pepper)).toBe(
      deriveOpaqueToken("session-token", "assessment_result", pepper),
    );
    expect(deriveOpaqueToken("session-token", "assessment_result", pepper)).not.toBe(
      deriveOpaqueToken("session-token", "result_share", pepper),
    );
    expect(deriveOpaqueToken("session-token", "assessment_result", pepper)).toMatch(
      /^[A-Za-z0-9_-]{43}$/u,
    );
  });

  it("stores and verifies only the keyed token hash", () => {
    const token = generateOpaqueToken();
    const hash = hashOpaqueToken(token, pepper);

    expect(hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(hash).not.toContain(token);
    expect(verifyOpaqueToken(token, hash, pepper)).toBe(true);
    expect(verifyOpaqueToken(`${token}x`, hash, pepper)).toBe(false);
  });

  it("rejects weak token peppers", () => {
    expect(() => hashOpaqueToken("token", "too-short")).toThrow("at least 32 characters");
  });
});

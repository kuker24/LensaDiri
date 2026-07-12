import { describe, expect, it } from "vitest";

import { normalizeEmail } from "@/lib/auth/email";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createClearedSessionCookie,
  createSessionCookie,
  getSessionCookieName,
  isSessionActive,
} from "@/lib/auth/session";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

describe("internal authentication primitives", () => {
  it("normalizes valid email addresses and rejects invalid or too-long values", () => {
    expect(normalizeEmail("  User.Name+tag@Example.COM ")).toBe("user.name+tag@example.com");
    expect(() => normalizeEmail("missing-at-sign")).toThrow();
    expect(() => normalizeEmail(`${"a".repeat(250)}@x.com`)).toThrow();
  });

  it("hashes and verifies password with Argon2id", async () => {
    const password = "correct horse battery staple";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/u);
    await expect(verifyPassword(passwordHash, password)).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, "incorrect password")).resolves.toBe(false);
  }, 30_000);

  it("rejects expired, revoked, and inactive sessions", () => {
    const now = new Date("2026-07-12T00:00:00.000Z");
    const activeSession = {
      accountStatus: "active" as const,
      expiresAt: new Date(now.getTime() + 1),
      revokedAt: null,
    };

    expect(isSessionActive(activeSession, now)).toBe(true);
    expect(isSessionActive({ ...activeSession, expiresAt: now }, now)).toBe(false);
    expect(isSessionActive({ ...activeSession, revokedAt: now }, now)).toBe(false);
    expect(isSessionActive({ ...activeSession, accountStatus: "suspended" }, now)).toBe(false);
  });

  it("uses standards-compliant production cookie names and local development cookies", () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const developmentCookie = createSessionCookie("token", expiresAt, false);
    const productionCookie = createSessionCookie("token", expiresAt, true);

    expect(getSessionCookieName(false)).toBe("lensadiri_session");
    expect(getSessionCookieName(true)).toBe("__Host-lensadiri_session");
    expect(developmentCookie.options.secure).toBe(false);
    expect(productionCookie.options.secure).toBe(true);
    expect(createClearedSessionCookie(false).options.maxAge).toBe(0);
  });

  it("allows internal redirects only", () => {
    expect(getSafeRedirectPath("/privacy?from=auth")).toBe("/privacy?from=auth");
    expect(getSafeRedirectPath("https://attacker.test")).toBe("/dashboard");
    expect(getSafeRedirectPath("//attacker.test")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\\attacker.test")).toBe("/dashboard");
  });
});

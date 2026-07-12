import { describe, expect, it } from "vitest";

import {
  CSRF_HEADER_NAME,
  createCsrfCookie,
  createCsrfNonce,
  createCsrfToken,
  getCsrfCookieName,
  isValidCsrfMutation,
  isValidCsrfToken,
} from "@/lib/security/csrf";

const secret = "csrf-secret-with-at-least-thirty-two-characters";
const origin = "http://localhost:3000";
const now = new Date("2026-07-12T10:00:00.000Z");

describe("CSRF protection", () => {
  it("accepts same-origin request with signed header token and nonce cookie", () => {
    const nonce = createCsrfNonce();
    const token = createCsrfToken(nonce, secret, now);
    const request = new Request("http://localhost:3000/api/auth/login", {
      headers: {
        cookie: `${getCsrfCookieName(false)}=${nonce}`,
        origin,
        [CSRF_HEADER_NAME]: token,
      },
      method: "POST",
    });

    expect(isValidCsrfMutation(request, origin, secret, false, now)).toBe(true);
  });

  it("rejects foreign origin, altered token, missing nonce, and expired token", () => {
    const nonce = createCsrfNonce();
    const token = createCsrfToken(nonce, secret, now);
    const baseHeaders = {
      cookie: `${getCsrfCookieName(false)}=${nonce}`,
      [CSRF_HEADER_NAME]: token,
    };

    expect(
      isValidCsrfMutation(
        new Request("http://localhost:3000/api/auth/login", {
          headers: { ...baseHeaders, origin: "https://attacker.test" },
          method: "POST",
        }),
        origin,
        secret,
        false,
        now,
      ),
    ).toBe(false);
    expect(isValidCsrfToken(`${token}a`, nonce, secret, now)).toBe(false);
    expect(isValidCsrfToken(token, undefined, secret, now)).toBe(false);
    expect(
      isValidCsrfToken(token, nonce, secret, new Date(now.getTime() + 2 * 60 * 60 * 1_000 + 1)),
    ).toBe(false);
  });

  it("marks nonce cookie httpOnly and scope-correct", () => {
    const cookie = createCsrfCookie(createCsrfNonce(), true, now);

    expect(cookie.name).toBe("__Host-lensadiri_csrf");
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.path).toBe("/");
    expect(cookie.options.secure).toBe(true);
  });
});

import { describe, expect, it } from "vitest";

import {
  getOidcCookieName,
  getOidcCookieOptions,
  isOidcProvider,
  openOidcTransaction,
  sealOidcTransaction,
  type OidcTransaction,
} from "@/lib/auth/oidc";

const secret = "s".repeat(32);
const transaction: OidcTransaction = {
  codeVerifier: "verifier",
  expiresAt: Date.now() + 60_000,
  nonce: "nonce",
  operation: "login",
  provider: "google",
  redirectTo: "/dashboard/results",
  state: "state",
};

describe("OIDC transaction primitives", () => {
  it("accepts only supported providers", () => {
    expect(isOidcProvider("google")).toBe(true);
    expect(isOidcProvider("apple")).toBe(true);
    expect(isOidcProvider("unknown")).toBe(false);
  });

  it("round-trips authenticated transaction state and rejects tampering", () => {
    const sealed = sealOidcTransaction(transaction, secret);
    expect(openOidcTransaction(sealed, secret)).toEqual(transaction);
    const tampered = Buffer.from(sealed, "base64url");
    const byte = tampered[20];
    expect(byte).toBeDefined();
    tampered[20] = (byte ?? 0) ^ 1;
    expect(openOidcTransaction(tampered.toString("base64url"), secret)).toBeNull();
  });

  it("rejects expired transactions", () => {
    const sealed = sealOidcTransaction({ ...transaction, expiresAt: Date.now() - 1 }, secret);
    expect(openOidcTransaction(sealed, secret)).toBeNull();
  });

  it("uses host-prefixed production cookies compatible with Apple form_post", () => {
    expect(getOidcCookieName("apple", true)).toBe("__Host-lensadiri_oidc_apple");
    expect(getOidcCookieOptions(true)).toMatchObject({
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    expect(getOidcCookieOptions(false)).toMatchObject({ sameSite: "lax", secure: false });
    expect(getOidcCookieOptions(true, true).maxAge).toBe(0);
  });
});

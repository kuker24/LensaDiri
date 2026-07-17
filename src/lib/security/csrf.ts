import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getCookieValue } from "@/lib/security/http";

export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_TOKEN_TTL_MS = 2 * 60 * 60 * 1_000;

export type CsrfCookie = {
  name: string;
  value: string;
  options: {
    expires: Date;
    httpOnly: true;
    maxAge: number;
    path: "/";
    sameSite: "lax";
    secure: boolean;
  };
};

function createSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getCsrfCookieName(isProduction: boolean): string {
  return isProduction ? "__Host-lensadiri_csrf" : "lensadiri_csrf";
}

export function createCsrfNonce(): string {
  return randomBytes(32).toString("base64url");
}

export function createCsrfToken(nonce: string, secret: string, now = new Date()): string {
  const issuedAt = Math.floor(now.getTime() / 1_000).toString();
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${createSignature(payload, secret)}`;
}

export function createCsrfCookie(
  nonce: string,
  isProduction: boolean,
  now = new Date(),
): CsrfCookie {
  return {
    name: getCsrfCookieName(isProduction),
    value: nonce,
    options: {
      expires: new Date(now.getTime() + CSRF_TOKEN_TTL_MS),
      httpOnly: true,
      maxAge: Math.floor(CSRF_TOKEN_TTL_MS / 1_000),
      path: "/",
      sameSite: "lax",
      secure: isProduction,
    },
  };
}

export function isValidCsrfToken(
  token: string | null,
  nonce: string | undefined,
  secret: string,
  now = new Date(),
): boolean {
  if (!token || !nonce) {
    return false;
  }

  const parts = token.split(".");
  const [issuedAtString, tokenNonce, signature] = parts;
  if (
    parts.length !== 3 ||
    !issuedAtString ||
    !tokenNonce ||
    !signature ||
    !/^\d+$/u.test(issuedAtString) ||
    !/^[A-Za-z0-9_-]{43,128}$/u.test(tokenNonce) ||
    !/^[a-f0-9]{64}$/u.test(signature)
  ) {
    return false;
  }

  const issuedAtMs = Number(issuedAtString) * 1_000;
  const ageMs = now.getTime() - issuedAtMs;
  if (!Number.isSafeInteger(issuedAtMs) || ageMs < -60_000 || ageMs > CSRF_TOKEN_TTL_MS) {
    return false;
  }

  const payload = `${issuedAtString}.${tokenNonce}`;
  return (
    constantTimeEqual(tokenNonce, nonce) &&
    constantTimeEqual(signature, createSignature(payload, secret))
  );
}

export function isSameOriginMutation(request: Request, expectedOrigin: string): boolean {
  return request.headers.get("origin") === expectedOrigin;
}

export function isValidCsrfMutation(
  request: Request,
  expectedOrigin: string,
  secret: string,
  isProduction: boolean,
  now = new Date(),
): boolean {
  const nonce = getCookieValue(request.headers.get("cookie"), getCsrfCookieName(isProduction));
  return (
    isSameOriginMutation(request, expectedOrigin) &&
    isValidCsrfToken(request.headers.get(CSRF_HEADER_NAME), nonce, secret, now)
  );
}

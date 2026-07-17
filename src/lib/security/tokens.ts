import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const MIN_TOKEN_BYTES = 16;
const RECOMMENDED_TOKEN_BYTES = 32;
const MIN_PEPPER_LENGTH = 32;

export function generateOpaqueToken(bytes = RECOMMENDED_TOKEN_BYTES): string {
  if (!Number.isInteger(bytes) || bytes < MIN_TOKEN_BYTES) {
    throw new RangeError(`Token size must be at least ${MIN_TOKEN_BYTES} bytes.`);
  }

  return randomBytes(bytes).toString("base64url");
}

export function deriveOpaqueToken(sourceToken: string, purpose: string, secret: string): string {
  if (sourceToken.length === 0 || !/^[a-z][a-z0-9_-]{2,63}$/u.test(purpose)) {
    throw new RangeError("Token source and valid purpose are required.");
  }
  if (secret.length < MIN_PEPPER_LENGTH) {
    throw new RangeError(`Token secret must contain at least ${MIN_PEPPER_LENGTH} characters.`);
  }
  return createHmac("sha256", secret)
    .update(`lensadiri:${purpose}:`, "utf8")
    .update(sourceToken, "utf8")
    .digest("base64url");
}

export function hashOpaqueToken(token: string, pepper: string): string {
  if (token.length === 0) {
    throw new RangeError("Token must not be empty.");
  }

  if (pepper.length < MIN_PEPPER_LENGTH) {
    throw new RangeError(`Token pepper must contain at least ${MIN_PEPPER_LENGTH} characters.`);
  }

  return createHmac("sha256", pepper).update(token, "utf8").digest("hex");
}

export function verifyOpaqueToken(token: string, expectedHash: string, pepper: string): boolean {
  if (!/^[a-f0-9]{64}$/u.test(expectedHash)) {
    return false;
  }

  const actualHash = hashOpaqueToken(token, pepper);
  return timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

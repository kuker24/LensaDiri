import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const oidcProviders = ["google", "apple"] as const;
export type OidcProvider = (typeof oidcProviders)[number];
export type OidcOperation = "link" | "login";

export type OidcTransaction = {
  accountId?: string;
  codeVerifier: string;
  expiresAt: number;
  nonce: string;
  operation: OidcOperation;
  provider: OidcProvider;
  redirectTo: string;
  sessionId?: string;
  state: string;
};

export function isOidcProvider(value: string): value is OidcProvider {
  return oidcProviders.includes(value as OidcProvider);
}

function keyFromSecret(secret: string): Buffer {
  return createHash("sha256").update("lensadiri:oidc-transaction:").update(secret).digest();
}

export function sealOidcTransaction(transaction: OidcTransaction, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(transaction), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

export function openOidcTransaction(value: string, secret: string): OidcTransaction | null {
  try {
    const sealed = Buffer.from(value, "base64url");
    if (sealed.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", keyFromSecret(secret), sealed.subarray(0, 12));
    decipher.setAuthTag(sealed.subarray(12, 28));
    const parsed = JSON.parse(
      Buffer.concat([decipher.update(sealed.subarray(28)), decipher.final()]).toString("utf8"),
    ) as Partial<OidcTransaction>;
    if (
      !isOidcProvider(parsed.provider ?? "") ||
      (parsed.operation !== "login" && parsed.operation !== "link") ||
      typeof parsed.state !== "string" ||
      typeof parsed.nonce !== "string" ||
      typeof parsed.codeVerifier !== "string" ||
      typeof parsed.redirectTo !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now() ||
      (parsed.operation === "link" &&
        (typeof parsed.accountId !== "string" || typeof parsed.sessionId !== "string"))
    ) {
      return null;
    }
    return parsed as OidcTransaction;
  } catch {
    return null;
  }
}

export function getOidcCookieName(provider: OidcProvider, isProduction: boolean): string {
  return `${isProduction ? "__Host-" : ""}lensadiri_oidc_${provider}`;
}

export function getOidcCookieOptions(isProduction: boolean, clear = false) {
  return {
    expires: clear ? new Date(0) : new Date(Date.now() + 10 * 60 * 1_000),
    httpOnly: true as const,
    maxAge: clear ? 0 : 10 * 60,
    path: "/" as const,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    secure: isProduction,
  };
}

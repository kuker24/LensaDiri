const CLAIM_KEY_PREFIX = "lensadiri_claimed_";

/**
 * Non-reversible fingerprint of a result token.
 *
 * The raw result token is a bearer credential for a private result, so it must
 * never be persisted in browser storage. A short digest is enough to key a
 * per-result UI flag without keeping the token itself around.
 */
function fingerprintToken(token: string): string {
  let hash = 5381;
  for (let index = 0; index < token.length; index += 1) {
    hash = ((hash << 5) + hash + token.charCodeAt(index)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/** True when the claim stage has already been shown for this result. */
export function hasClaimedCharacter(token: string): boolean {
  if (typeof window === "undefined" || !token) return false;
  try {
    return localStorage.getItem(CLAIM_KEY_PREFIX + fingerprintToken(token)) === "1";
  } catch {
    // Ignore storage errors; treat as not yet claimed.
  }
  return false;
}

/** Record that the claim stage has been shown for this result. */
export function markCharacterClaimed(token: string): void {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(CLAIM_KEY_PREFIX + fingerprintToken(token), "1");
  } catch {
    // Ignore storage errors; claim stage may show again.
  }
}

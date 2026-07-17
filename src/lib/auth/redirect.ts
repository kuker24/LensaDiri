const DEFAULT_POST_AUTH_REDIRECT = "/dashboard";

export function getSafeRedirectPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return DEFAULT_POST_AUTH_REDIRECT;
  }

  try {
    const candidate = new URL(value, "https://lensadiri.invalid");
    return candidate.origin === "https://lensadiri.invalid"
      ? `${candidate.pathname}${candidate.search}`
      : DEFAULT_POST_AUTH_REDIRECT;
  } catch {
    return DEFAULT_POST_AUTH_REDIRECT;
  }
}

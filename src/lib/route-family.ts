export type RouteFamily = "public" | "assessment" | "account" | "operator";

/**
 * The `auth` family was removed along with the sign-in pages. Nothing can serve
 * `/login`, `/register`, `/forgot-password`, `/reset-password`, or
 * `/verify-email` any more, so those paths fall through to `public` and are
 * answered by the 404 page like any other unknown route.
 */
export function getRouteFamily(pathname: string): RouteFamily {
  if (pathname === "/start" || /^\/(?:start|test|result|shared)(?:\/|$)/u.test(pathname)) {
    return "assessment";
  }
  if (/^\/dashboard(?:\/|$)/u.test(pathname)) return "account";
  if (/^\/admin(?:\/|$)/u.test(pathname)) return "operator";
  return "public";
}

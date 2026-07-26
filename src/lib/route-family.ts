export type RouteFamily = "public" | "auth" | "assessment" | "account" | "operator";

const authRoutes = new Set([
  "/forgot-password",
  "/login",
  "/register",
  "/reset-password",
  "/verify-email",
]);

export function getRouteFamily(pathname: string): RouteFamily {
  if (authRoutes.has(pathname)) return "auth";
  if (pathname === "/start" || /^\/(?:start|test|result|shared)(?:\/|$)/u.test(pathname)) {
    return "assessment";
  }
  if (/^\/dashboard(?:\/|$)/u.test(pathname)) return "account";
  if (/^\/admin(?:\/|$)/u.test(pathname)) return "operator";
  return "public";
}

import { NextResponse } from "next/server";
import * as oauth from "oauth4webapi";

import {
  getOidcCookieName,
  getOidcCookieOptions,
  isOidcProvider,
  sealOidcTransaction,
  type OidcOperation,
} from "@/lib/auth/oidc";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getServerEnvironment } from "@/lib/db/env";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { getCurrentSession } from "@/server/current-session";
import { createOidcAuthorizationUrl } from "@/server/services/oidc";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider } = await context.params;
  if (!isOidcProvider(provider)) return new NextResponse(null, { status: 404 });
  const environment = getServerEnvironment();
  if ((provider === "google" ? environment.googleOidc : environment.appleOidc) === null) {
    return NextResponse.redirect(
      new URL("/login?authError=provider_unavailable", environment.appOrigin),
    );
  }
  try {
    const rateLimit = await consumeRateLimit(
      `${provider}:oidc-start:${getRequestRateLimitIdentity(request)}`,
      authRateLimitPolicies.oidcStart,
      environment.rateLimitSecret,
    );
    if (!rateLimit.allowed) {
      return NextResponse.redirect(new URL("/login?authError=rate_limited", environment.appOrigin));
    }
  } catch {
    return NextResponse.redirect(
      new URL("/login?authError=provider_unavailable", environment.appOrigin),
    );
  }
  const requestUrl = new URL(request.url);
  const operation: OidcOperation =
    requestUrl.searchParams.get("operation") === "link" ? "link" : "login";
  const currentSession = operation !== "login" ? await getCurrentSession() : null;
  if (operation !== "login" && !currentSession) {
    return NextResponse.redirect(
      new URL("/login?redirectTo=%2Fdashboard%2Fsettings", environment.appOrigin),
    );
  }
  const transaction = {
    ...(currentSession
      ? { accountId: currentSession.accountId, sessionId: currentSession.sessionId }
      : {}),
    codeVerifier: oauth.generateRandomCodeVerifier(),
    expiresAt: Date.now() + 10 * 60 * 1_000,
    nonce: oauth.generateRandomNonce(),
    operation,
    provider,
    redirectTo: getSafeRedirectPath(requestUrl.searchParams.get("redirectTo") ?? undefined),
    state: oauth.generateRandomState(),
  };
  try {
    const authorizationUrl = await createOidcAuthorizationUrl(transaction, environment);
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(
      getOidcCookieName(provider, environment.isProduction),
      sealOidcTransaction(transaction, environment.authSessionSecret),
      getOidcCookieOptions(environment.isProduction),
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/login?authError=provider_unavailable", environment.appOrigin),
    );
  }
}

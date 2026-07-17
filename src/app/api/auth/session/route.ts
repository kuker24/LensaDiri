import { NextResponse } from "next/server";

import { getSessionCookieName, isOpaqueSessionToken } from "@/lib/auth/session";
import { getServerEnvironment } from "@/lib/db/env";
import {
  createCsrfCookie,
  createCsrfNonce,
  createCsrfToken,
  getCsrfCookieName,
} from "@/lib/security/csrf";
import { getCookieValue } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getActiveSession } from "@/server/services/auth";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const environment = getServerEnvironment();

  try {
    const limited = await consumeRateLimit(
      getRequestRateLimitIdentity(request),
      authRateLimitPolicies.session,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": limited.retryAfterSeconds.toString() },
        status: 429,
      });
    }

    const existingNonce = getCookieValue(
      request.headers.get("cookie"),
      getCsrfCookieName(environment.isProduction),
    );
    const nonce =
      existingNonce && /^[A-Za-z0-9_-]{43,128}$/u.test(existingNonce)
        ? existingNonce
        : createCsrfNonce();
    const token = getCookieValue(
      request.headers.get("cookie"),
      getSessionCookieName(environment.isProduction),
    );
    const session =
      token && isOpaqueSessionToken(token)
        ? await getActiveSession(token, environment.tokenHashPepper)
        : null;

    const response = NextResponse.json(
      apiSuccess({
        authenticated: session !== null,
        csrfToken: createCsrfToken(nonce, environment.csrfSecret),
      }),
      { headers: noStoreHeaders, status: 200 },
    );
    const csrfCookie = createCsrfCookie(nonce, environment.isProduction);
    response.cookies.set(csrfCookie.name, csrfCookie.value, csrfCookie.options);
    return response;
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

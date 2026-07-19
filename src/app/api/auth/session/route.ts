import { NextResponse } from "next/server";

import { DatabaseTimeoutError, withDeadline } from "@/lib/async/with-deadline";
import {
  createClearedSessionCookie,
  getSessionCookieName,
  isOpaqueSessionToken,
} from "@/lib/auth/session";
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

const SESSION_DB_DEADLINE_MS = 3_000;

export async function GET(request: Request): Promise<NextResponse> {
  const environment = getServerEnvironment();

  try {
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

    // 1. Database-Independent Bootstrap for Anonymous / Format-Invalid Requests
    // If there is no session token, or the session token is format-invalid, do not query the DB.
    // Return authenticated=false along with a secure CSRF token.
    if (!token || !isOpaqueSessionToken(token)) {
      const response = NextResponse.json(
        apiSuccess({
          authenticated: false,
          csrfToken: createCsrfToken(nonce, environment.csrfSecret),
        }),
        { headers: noStoreHeaders, status: 200 },
      );
      const csrfCookie = createCsrfCookie(nonce, environment.isProduction);
      response.cookies.set(csrfCookie.name, csrfCookie.value, csrfCookie.options);
      if (token) {
        const clearedSessionCookie = createClearedSessionCookie(environment.isProduction);
        response.cookies.set(
          clearedSessionCookie.name,
          clearedSessionCookie.value,
          clearedSessionCookie.options,
        );
      }
      return response;
    }

    // Valid-looking tokens retain abuse protection; only anonymous/invalid bootstrap avoids DB writes.
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

    const session = await withDeadline(
      getActiveSession(token, environment.tokenHashPepper),
      SESSION_DB_DEADLINE_MS,
    );

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
    if (error instanceof DatabaseTimeoutError) {
      return NextResponse.json(apiFailure("service_unavailable"), {
        headers: noStoreHeaders,
        status: 503,
      });
    }
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

import { NextResponse } from "next/server";

import { createClearedSessionCookie, getSessionCookieName } from "@/lib/auth/session";
import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { getCookieValue } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { logoutAccount } from "@/server/services/auth";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const environment = getServerEnvironment();
  if (
    !isValidCsrfMutation(
      request,
      environment.appOrigin,
      environment.csrfSecret,
      environment.isProduction,
    )
  ) {
    return NextResponse.json(apiFailure("csrf_invalid"), { headers: noStoreHeaders, status: 403 });
  }

  try {
    const limited = await consumeRateLimit(
      getRequestRateLimitIdentity(request),
      authRateLimitPolicies.logout,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": limited.retryAfterSeconds.toString() },
        status: 429,
      });
    }

    const token = getCookieValue(
      request.headers.get("cookie"),
      getSessionCookieName(environment.isProduction),
    );
    await logoutAccount(token, environment.tokenHashPepper);

    const response = NextResponse.json(apiSuccess({ status: "logged_out" }), {
      headers: noStoreHeaders,
      status: 200,
    });
    const cookie = createClearedSessionCookie(environment.isProduction);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

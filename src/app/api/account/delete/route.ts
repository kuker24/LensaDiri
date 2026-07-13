import { NextResponse } from "next/server";

import {
  createClearedSessionCookie,
  getSessionCookieName,
  isOpaqueSessionToken,
} from "@/lib/auth/session";
import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { getCookieValue, parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { deleteAccountRequestSchema } from "@/lib/validation/auth";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { deleteAccount } from "@/server/services/auth";
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

  const parsed = await parseJsonRequest(request, deleteAccountRequestSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  const sessionToken = getCookieValue(
    request.headers.get("cookie"),
    getSessionCookieName(environment.isProduction),
  );
  if (!sessionToken || !isOpaqueSessionToken(sessionToken)) {
    return NextResponse.json(apiFailure("authentication_required"), {
      headers: noStoreHeaders,
      status: 401,
    });
  }

  try {
    const limited = await consumeRateLimit(
      `${getRequestRateLimitIdentity(request)}:${sessionToken.slice(0, 16)}`,
      authRateLimitPolicies.accountDelete,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": limited.retryAfterSeconds.toString() },
        status: 429,
      });
    }

    const result = await deleteAccount({
      password: parsed.data.password,
      sessionToken,
      tokenHashPepper: environment.tokenHashPepper,
    });
    if (result !== "deleted") {
      return NextResponse.json(
        apiFailure(
          result === "invalid_credentials" ? "invalid_credentials" : "authentication_required",
        ),
        { headers: noStoreHeaders, status: 401 },
      );
    }

    const response = NextResponse.json(apiSuccess({ status: "account_deleted" }), {
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

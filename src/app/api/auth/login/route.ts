import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { createSessionCookie } from "@/lib/auth/session";
import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { parseJsonRequest } from "@/lib/security/http";
import { loginRequestSchema } from "@/lib/validation/auth";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { loginAccount } from "@/server/services/auth";

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

  const parsed = await parseJsonRequest(request, loginRequestSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  try {
    const correlationId = crypto.randomUUID();
    const loginResult = await loginAccount({
      email: parsed.data.email,
      fingerprint: {
        ip: getRequestRateLimitIdentity(request),
        userAgent: request.headers.get("user-agent") ?? "",
      },
      password: parsed.data.password,
      secrets: {
        authSessionSecret: environment.authSessionSecret,
        tokenHashPepper: environment.tokenHashPepper,
        rateLimitSecret: environment.rateLimitSecret,
      },
      correlationId,
    });

    if (!loginResult.success) {
      if (loginResult.error.code === "rate_limited") {
        return NextResponse.json(apiFailure("rate_limited"), {
          headers: {
            ...noStoreHeaders,
            "Retry-After": String(loginResult.error.retryAfterSeconds),
          },
          status: 429,
        });
      } else {
        return NextResponse.json(apiFailure(loginResult.error.code), {
          headers: noStoreHeaders,
          status: loginResult.error.status,
        });
      }
    }

    const session = loginResult.data;
    const response = NextResponse.json(apiSuccess({ status: "authenticated" }), {
      headers: noStoreHeaders,
      status: 200,
    });
    const cookie = createSessionCookie(session.token, session.expiresAt, environment.isProduction);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

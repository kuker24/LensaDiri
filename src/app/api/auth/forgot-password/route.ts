import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/email";
import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { recoveryRequestSchema } from "@/lib/validation/auth";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { requestPasswordReset } from "@/server/services/account-recovery";
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
  const parsed = await parseJsonRequest(request, recoveryRequestSchema);
  if (!parsed.success)
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  try {
    const identity = `${getRequestRateLimitIdentity(request)}:${normalizeEmail(parsed.data.email)}`;
    const limited = await consumeRateLimit(
      identity,
      authRateLimitPolicies.forgotPassword,
      environment.rateLimitSecret,
    );
    if (!limited.allowed)
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    await requestPasswordReset(parsed.data.email, environment.tokenHashPepper);
    return NextResponse.json(apiSuccess({ status: "request_accepted" }), {
      headers: noStoreHeaders,
      status: 202,
    });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

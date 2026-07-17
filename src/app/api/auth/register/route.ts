import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { registerRequestSchema } from "@/lib/validation/auth";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { registerAccount } from "@/server/services/auth";
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

  const parsed = await parseJsonRequest(request, registerRequestSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  try {
    const requestIdentity = getRequestRateLimitIdentity(request);
    const limited = await consumeRateLimit(
      process.env.NODE_ENV !== "production" &&
        process.env.RECOVERY_TEST_TRANSPORT === "1" &&
        process.env.TEST_DATABASE_URL
        ? `${requestIdentity}:${parsed.data.email.toLowerCase()}`
        : requestIdentity,
      authRateLimitPolicies.register,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": limited.retryAfterSeconds.toString() },
        status: 429,
      });
    }

    await registerAccount(parsed.data);
    // Same response for new and duplicate emails prevents account enumeration.
    return NextResponse.json(apiSuccess({ status: "registration_accepted" }), {
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

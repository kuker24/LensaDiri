import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { tokenRequestSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { setAssessmentPaused } from "@/server/repositories/assessment";
import {
  assessmentRateLimitPolicies,
  consumeRateLimit,
  type RateLimitPolicy,
} from "@/server/services/rate-limiter";

export async function handleAssessmentPauseMutation(
  request: Request,
  paused: boolean,
): Promise<NextResponse> {
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
  const parsed = await parseJsonRequest(request, tokenRequestSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  const sessionHash = hashOpaqueToken(parsed.data.token, environment.tokenHashPepper);
  const policy: RateLimitPolicy = paused
    ? assessmentRateLimitPolicies.pause
    : assessmentRateLimitPolicies.resume;
  try {
    const limited = await consumeRateLimit(sessionHash, policy, environment.rateLimitSecret);
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }
    const changed = await setAssessmentPaused(sessionHash, paused);
    return NextResponse.json(
      changed ? apiSuccess({ status: paused ? "paused" : "active" }) : apiFailure("invalid_state"),
      { headers: noStoreHeaders, status: changed ? 200 : 409 },
    );
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

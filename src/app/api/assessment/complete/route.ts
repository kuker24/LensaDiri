import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { deriveOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { completeAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { completeAssessment } from "@/server/repositories/assessment";
import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

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
  )
    return NextResponse.json(apiFailure("csrf_invalid"), { headers: noStoreHeaders, status: 403 });
  const parsed = await parseJsonRequest(request, completeAssessmentSchema);
  if (!parsed.success)
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  const sessionHash = hashOpaqueToken(parsed.data.token, environment.tokenHashPepper);
  try {
    const limited = await consumeRateLimit(
      sessionHash,
      assessmentRateLimitPolicies.complete,
      environment.rateLimitSecret,
    );
    if (!limited.allowed)
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    const resultToken = deriveOpaqueToken(
      parsed.data.token,
      "assessment_result",
      environment.tokenHashPepper,
    );
    const completed = await completeAssessment({
      resultTokenHash: hashOpaqueToken(resultToken, environment.tokenHashPepper),
      sessionTokenHash: sessionHash,
    });
    if (!completed) {
      return NextResponse.json(apiFailure("assessment_incomplete"), {
        headers: noStoreHeaders,
        status: 409,
      });
    }
    if ("status" in completed) {
      return NextResponse.json(
        apiSuccess({ clarifiers: completed.clarifiers, status: completed.status }),
        { headers: noStoreHeaders, status: 202 },
      );
    }
    return NextResponse.json(apiSuccess({ resultToken }), {
      headers: noStoreHeaders,
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

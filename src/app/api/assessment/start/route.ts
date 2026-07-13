import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { startAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { createAssessmentSession } from "@/server/repositories/assessment";
import { getCurrentSession } from "@/server/current-session";
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
  ) {
    return NextResponse.json(apiFailure("csrf_invalid"), { headers: noStoreHeaders, status: 403 });
  }
  const parsed = await parseJsonRequest(request, startAssessmentSchema);
  if (!parsed.success)
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });

  try {
    const limited = await consumeRateLimit(
      getRequestRateLimitIdentity(request),
      assessmentRateLimitPolicies.start,
      environment.rateLimitSecret,
    );
    if (!limited.allowed)
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });

    const token = generateOpaqueToken();
    const account = await getCurrentSession();
    await createAssessmentSession({
      accountId: account?.accountId ?? null,
      consentVersion: "2026-07-13",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000),
      mode: parsed.data.mode,
      sessionTokenHash: hashOpaqueToken(token, environment.tokenHashPepper),
    });
    return NextResponse.json(apiSuccess({ token }), { headers: noStoreHeaders, status: 201 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

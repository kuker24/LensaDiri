import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { getCurrentSession } from "@/server/current-session";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { consentTypes } from "@/server/repositories/consents";
import { recordAccountOptionalConsent } from "@/server/repositories/privacy";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

const requestSchema = z.object({
  accepted: z.boolean(),
  consentType: z.enum(consentTypes),
  version: z.string().trim().min(1).max(100),
});

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

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(apiFailure("unauthorized"), { headers: noStoreHeaders, status: 401 });
  }

  const parsed = await parseJsonRequest(request, requestSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  try {
    const limited = await consumeRateLimit(
      session.accountId,
      authRateLimitPolicies.session,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }

    const recorded = await recordAccountOptionalConsent({
      ...parsed.data,
      accountId: session.accountId,
    });
    return NextResponse.json(recorded ? apiSuccess({ recorded: true }) : apiFailure("invalid_state"), {
      headers: noStoreHeaders,
      status: recorded ? 200 : 409,
    });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

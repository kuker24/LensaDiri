import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { opaqueTokenSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getIdentityJourneyByHash } from "@/server/repositories/identity-journeys";
import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await context.params;
  if (!opaqueTokenSchema.safeParse(token).success) {
    return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  }
  try {
    const environment = getServerEnvironment();
    const journeyTokenHash = hashOpaqueToken(token, environment.tokenHashPepper);
    const limited = await consumeRateLimit(
      journeyTokenHash,
      assessmentRateLimitPolicies.journeyRead,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }
    const journey = await getIdentityJourneyByHash(journeyTokenHash);
    return journey
      ? NextResponse.json(apiSuccess(journey), { headers: noStoreHeaders })
      : NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { resultMutationSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { deleteResultByHash } from "@/server/repositories/assessment";
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
  const parsed = await parseJsonRequest(request, resultMutationSchema);
  if (!parsed.success)
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  const resultHash = hashOpaqueToken(parsed.data.token, environment.tokenHashPepper);
  try {
    const limited = await consumeRateLimit(
      resultHash,
      assessmentRateLimitPolicies.resultDelete,
      environment.rateLimitSecret,
    );
    if (!limited.allowed)
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: noStoreHeaders,
        status: 429,
      });
    const deleted = await deleteResultByHash(resultHash);
    return NextResponse.json(
      deleted ? apiSuccess({ status: "deleted" }) : apiFailure("not_found"),
      { headers: noStoreHeaders, status: deleted ? 200 : 404 },
    );
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/db/env";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { opaqueTokenSchema } from "@/lib/validation/assessment";
import { apiFailure, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getResultByHash } from "@/server/repositories/assessment";
import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await context.params;
  if (!opaqueTokenSchema.safeParse(token).success)
    return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  const environment = getServerEnvironment();
  const resultHash = hashOpaqueToken(token, environment.tokenHashPepper);
  try {
    const limited = await consumeRateLimit(
      resultHash,
      assessmentRateLimitPolicies.resultExport,
      environment.rateLimitSecret,
    );
    if (!limited.allowed)
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: noStoreHeaders,
        status: 429,
      });
    const result = await getResultByHash(resultHash);
    return result
      ? NextResponse.json(
          { exportedAt: new Date().toISOString(), result },
          {
            headers: {
              ...noStoreHeaders,
              "Content-Disposition": "attachment; filename=lensadiri-result.json",
            },
          },
        )
      : NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

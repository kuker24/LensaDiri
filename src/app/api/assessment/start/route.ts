import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { startAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getCurrentSession } from "@/server/current-session";
import { startAssessment } from "@/server/services/assessment";
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

  let limited: Awaited<ReturnType<typeof consumeRateLimit>>;
  try {
    limited = await consumeRateLimit(
      getRequestRateLimitIdentity(request),
      assessmentRateLimitPolicies.start,
      environment.rateLimitSecret,
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "rate_limit_unavailable" },
        message: "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
      },
      { headers: noStoreHeaders, status: 503 },
    );
  }
  if (!limited.allowed)
    return NextResponse.json(apiFailure("rate_limited"), {
      headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
      status: 429,
    });

  try {
    const token = generateOpaqueToken();
    const account = await getCurrentSession();
    const startRequest =
      "moduleKeys" in parsed.data
        ? {
            kind: "modular" as const,
            locale: parsed.data.locale,
            selection: {
              age: parsed.data.age,
              experimentalAcknowledged: parsed.data.experimentalAcknowledged,
              mode: parsed.data.mode,
              moduleKeys: parsed.data.moduleKeys,
              presetKey: parsed.data.presetKey,
              selectionType: parsed.data.selectionType,
            },
          }
        : { kind: "legacy" as const, mode: parsed.data.mode };
    const started = await startAssessment({
      accountId: account?.accountId ?? null,
      consentVersion: "2026-07-13",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000),
      request: startRequest,
      sessionTokenHash: hashOpaqueToken(token, environment.tokenHashPepper),
    });
    return started.success
      ? NextResponse.json(apiSuccess({ flow: started.kind, token }), {
          headers: noStoreHeaders,
          status: 201,
        })
      : NextResponse.json(apiFailure(started.code), {
          headers: noStoreHeaders,
          status: 422,
        });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

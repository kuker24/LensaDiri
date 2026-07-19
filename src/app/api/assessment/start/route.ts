import { NextResponse } from "next/server";

import type { z } from "zod";

import { DatabaseTimeoutError, withDeadline } from "@/lib/async/with-deadline";
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

/**
 * Wall-clock deadline for the full assessment start flow:
 * current-session lookup → catalog context → composer candidates →
 * estimate validation → blueprint composition → persistent write.
 *
 * Every DB operation inside this scope already has a 10 s statement_timeout
 * at the connection level, but the wall-clock deadline ensures the route
 * returns a 503 response before the Hobby plan timeout (10 s) and without
 * waiting for a stalled connection or slow query to resolve on its own.
 */
const START_DB_DEADLINE_MS = 8_000;

/**
 * Collects the authenticated account (if any), generates a fresh
 * session token, and runs the full start assessment pipeline inside
 * a single deadline boundary. Any DB stall or timeout raises
 * DatabaseTimeoutError, which the caller maps to a safe 503.
 */
type StartRequestData = z.infer<typeof startAssessmentSchema>;

async function runStartFlow(
  parsedData: StartRequestData,
  environment: ReturnType<typeof getServerEnvironment>,
  token: string,
): Promise<{ flow: string; success: true; token: string } | { code: string; success: false }> {
  const account = await getCurrentSession();
  let startRequest: Parameters<typeof startAssessment>[0]["request"];

  if ("moduleKeys" in parsedData) {
    startRequest = {
      kind: "modular" as const,
      locale: parsedData.locale,
      selection: {
        age: parsedData.age,
        experimentalAcknowledged: parsedData.experimentalAcknowledged,
        mode: parsedData.mode,
        moduleKeys: parsedData.moduleKeys,
        presetKey: parsedData.presetKey,
        selectionType: parsedData.selectionType,
      },
    };
  } else {
    startRequest = {
      kind: "legacy" as const,
      mode: parsedData.mode,
    };
  }

  const started = await startAssessment({
    accountId: account?.accountId ?? null,
    consentVersion: "2026-07-13",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000),
    request: startRequest,
    sessionTokenHash: hashOpaqueToken(token, environment.tokenHashPepper),
  });

  return started.success
    ? { success: true as const, flow: started.kind, token }
    : { success: false as const, code: started.code };
}

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
    const result = await withDeadline(
      runStartFlow(parsed.data, environment, token),
      START_DB_DEADLINE_MS,
    );
    return result.success
      ? NextResponse.json(apiSuccess({ flow: result.flow, token }), {
          headers: noStoreHeaders,
          status: 201,
        })
      : NextResponse.json(apiFailure(result.code), {
          headers: noStoreHeaders,
          status: 422,
        });
  } catch (error) {
    if (error instanceof DatabaseTimeoutError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "assessment_service_busy" },
          message: "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
        },
        { headers: noStoreHeaders, status: 503 },
      );
    }
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

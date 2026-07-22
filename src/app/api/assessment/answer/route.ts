import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { answerAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { elapsedMilliseconds, logOperationalEvent } from "@/server/observability";
import { saveAssessmentAnswer } from "@/server/repositories/assessment";
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
  const parsed = await parseJsonRequest(request, answerAssessmentSchema);
  if (!parsed.success)
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  const correlationId = crypto.randomUUID();
  const startedAt = process.hrtime.bigint();
  const sessionHash = hashOpaqueToken(parsed.data.token, environment.tokenHashPepper);
  try {
    const limited = await consumeRateLimit(
      sessionHash,
      assessmentRateLimitPolicies.answer,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      logOperationalEvent({
        correlationId,
        durationMs: elapsedMilliseconds(startedAt),
        operation: "assessment_answer_save",
        status: "rate_limited",
      });
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }
    const saved = await saveAssessmentAnswer({
      idempotencyKey: parsed.data.idempotencyKey,
      questionId: parsed.data.questionId,
      rawValue: parsed.data.value,
      responseTimeMs: parsed.data.responseTimeMs ?? null,
      sessionTokenHash: sessionHash,
    });
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startedAt),
      operation: "assessment_answer_save",
      status: saved ? "success" : "rejected",
    });
    return NextResponse.json(saved ? apiSuccess({ status: "saved" }) : apiFailure("not_found"), {
      headers: noStoreHeaders,
      status: saved ? 200 : 404,
    });
  } catch (error) {
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startedAt),
      errorCode: "database_error",
      operation: "assessment_answer_save",
      status: "failure",
    });
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { deriveOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { clarifierAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import {
  resolveClarifier,
  saveClarifierAnswer,
  startClarifier,
} from "@/server/repositories/assessment";
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
    return NextResponse.json(apiFailure("csrf_invalid"), {
      headers: noStoreHeaders,
      status: 403,
    });
  }
  const parsed = await parseJsonRequest(request, clarifierAssessmentSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), {
      headers: noStoreHeaders,
      status: 400,
    });
  }

  const sessionHash = hashOpaqueToken(parsed.data.token, environment.tokenHashPepper);
  try {
    const limited = await consumeRateLimit(
      sessionHash,
      assessmentRateLimitPolicies.clarifier,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }

    if (parsed.data.action === "start") {
      const clarifier = await startClarifier(sessionHash);
      return NextResponse.json(clarifier ? apiSuccess(clarifier) : apiFailure("invalid_state"), {
        headers: noStoreHeaders,
        status: clarifier ? 200 : 409,
      });
    }
    if (parsed.data.action === "answer") {
      const saved = await saveClarifierAnswer({
        questionId: parsed.data.questionId,
        rawValue: parsed.data.value,
        responseTimeMs: parsed.data.responseTimeMs ?? null,
        sessionTokenHash: sessionHash,
      });
      return NextResponse.json(saved ? apiSuccess({ status: "saved" }) : apiFailure("not_found"), {
        headers: noStoreHeaders,
        status: saved ? 200 : 404,
      });
    }

    const resultToken = deriveOpaqueToken(
      parsed.data.token,
      "assessment_result",
      environment.tokenHashPepper,
    );
    const completed = await resolveClarifier({
      action: parsed.data.action,
      resultTokenHash: hashOpaqueToken(resultToken, environment.tokenHashPepper),
      sessionTokenHash: sessionHash,
    });
    return NextResponse.json(
      completed && "resultId" in completed
        ? apiSuccess({ resultToken, status: "completed" })
        : apiFailure("assessment_incomplete"),
      { headers: noStoreHeaders, status: completed && "resultId" in completed ? 201 : 409 },
    );
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

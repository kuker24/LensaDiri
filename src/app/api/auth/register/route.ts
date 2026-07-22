import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { DatabaseTimeoutError, withDeadline } from "@/lib/async/with-deadline";
import { getServerEnvironment } from "@/lib/db/env";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { registerRequestSchema } from "@/lib/validation/auth";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { elapsedMilliseconds, logOperationalEvent } from "@/server/observability";
import { registerAccount } from "@/server/services/auth";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

const REGISTER_DB_DEADLINE_MS = 5_000;

export async function POST(request: Request): Promise<NextResponse> {
  const correlationId = crypto.randomUUID();
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

  const parsed = await parseJsonRequest(request, registerRequestSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  try {
    const requestIdentity = getRequestRateLimitIdentity(request);

    const startRateLimit = process.hrtime.bigint();
    let limited: Awaited<ReturnType<typeof consumeRateLimit>>;
    try {
      limited = await consumeRateLimit(
        process.env.NODE_ENV !== "production" &&
          process.env.RECOVERY_TEST_TRANSPORT === "1" &&
          process.env.TEST_DATABASE_URL
          ? `${requestIdentity}:${parsed.data.email.toLowerCase()}`
          : requestIdentity,
        authRateLimitPolicies.register,
        environment.rateLimitSecret,
      );
      logOperationalEvent({
        correlationId,
        durationMs: elapsedMilliseconds(startRateLimit),
        operation: "register_rate_limit",
        status: limited.allowed ? "success" : "rate_limited",
      });
    } catch (error) {
      logOperationalEvent({
        correlationId,
        durationMs: elapsedMilliseconds(startRateLimit),
        operation: "register_rate_limit",
        status: "error",
      });
      throw error;
    }

    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": limited.retryAfterSeconds.toString() },
        status: 429,
      });
    }

    const startRegister = process.hrtime.bigint();
    await withDeadline(registerAccount(parsed.data, correlationId), REGISTER_DB_DEADLINE_MS);
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startRegister),
      operation: "register_auth_service",
      status: "success",
    });

    // Same response for new and duplicate emails prevents account enumeration.
    return NextResponse.json(apiSuccess({ status: "registration_accepted" }), {
      headers: noStoreHeaders,
      status: 202,
    });
  } catch (error) {
    const isTimeout = error instanceof DatabaseTimeoutError;
    logOperationalEvent({
      correlationId,
      errorCode: isTimeout ? "deadline_exceeded" : "database_error",
      operation: "register_auth_service",
      status: "failure",
    });
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: isTimeout ? 503 : getDatabaseFailureStatus(error),
    });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { getCurrentSession } from "@/server/current-session";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { rotateAccountResultToken, rotateAccountSessionToken } from "@/server/repositories/dashboard";
import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

const requestSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["session", "result"]),
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
      parsed.data.kind === "session"
        ? assessmentRateLimitPolicies.resume
        : assessmentRateLimitPolicies.resultExport,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }

    const token = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(token, environment.tokenHashPepper);
    const opened =
      parsed.data.kind === "session"
        ? await rotateAccountSessionToken({
            accountId: session.accountId,
            sessionId: parsed.data.id,
            sessionTokenHash: tokenHash,
          })
        : await rotateAccountResultToken({
            accountId: session.accountId,
            resultId: parsed.data.id,
            resultTokenHash: tokenHash,
          });

    return NextResponse.json(
      opened
        ? apiSuccess({ href: `/${parsed.data.kind === "session" ? "test" : "result"}/${token}` })
        : apiFailure("not_found"),
      { headers: noStoreHeaders, status: opened ? 200 : 404 },
    );
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

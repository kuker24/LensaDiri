import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { continueIdentityJourneySchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getCurrentSession } from "@/server/current-session";
import { loadModularAssessmentContextFromCache } from "@/server/repositories/catalog-cache";
import { getAvailableJourneyModuleByHash } from "@/server/repositories/identity-journeys";
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
  const parsed = await parseJsonRequest(request, continueIdentityJourneySchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  const journeyTokenHash = hashOpaqueToken(parsed.data.journeyToken, environment.tokenHashPepper);
  try {
    const limited = await consumeRateLimit(
      journeyTokenHash,
      assessmentRateLimitPolicies.start,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }
    const account = await getCurrentSession();
    const accountId = account?.accountId ?? null;
    const step = await getAvailableJourneyModuleByHash(journeyTokenHash, accountId);
    if (!step.success) {
      return NextResponse.json(apiFailure(step.code), {
        headers: noStoreHeaders,
        status: step.code === "journey_owner_mismatch" ? 403 : 409,
      });
    }
    if (!parsed.data.experimentalAcknowledged) {
      return NextResponse.json(apiFailure("experimental_acknowledgment_required"), {
        headers: noStoreHeaders,
        status: 422,
      });
    }
    const moduleKey = step.moduleKey;
    const token = generateOpaqueToken();
    const started = await startAssessment(
      {
        accountId,
        consentVersion: "identity-journey-1",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000),
        request: {
          journey: { journeyTokenHash, kind: "continue" },
          kind: "modular",
          locale: "id",
          selection: {
            age: parsed.data.age,
            experimentalAcknowledged: parsed.data.experimentalAcknowledged,
            mode: "standard",
            moduleKeys: [moduleKey],
            presetKey: null,
            selectionType: "single",
          },
        },
        sessionTokenHash: hashOpaqueToken(token, environment.tokenHashPepper),
      },
      { loadModularContext: loadModularAssessmentContextFromCache },
    );
    return started.success
      ? NextResponse.json(apiSuccess({ moduleKey, token }), {
          headers: noStoreHeaders,
          status: 201,
        })
      : NextResponse.json(apiFailure(started.code), { headers: noStoreHeaders, status: 422 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

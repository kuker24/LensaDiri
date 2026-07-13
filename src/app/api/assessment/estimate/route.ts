import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { estimateAssessment } from "@/lib/assessment/estimate";
import { parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { estimateAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import {
  isFeatureEnabled,
  listAssessmentModeProfiles,
  listCatalogModules,
  listComboPresets,
} from "@/server/repositories/catalog";
import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseJsonRequest(request, estimateAssessmentSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  const environment = getServerEnvironment();
  try {
    const limited = await consumeRateLimit(
      getRequestRateLimitIdentity(request),
      assessmentRateLimitPolicies.estimate,
      environment.rateLimitSecret,
    );
    if (!limited.allowed) {
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
        status: 429,
      });
    }

    const [modules, combos, modeProfiles, precisionEnabled, complexEnabled] = await Promise.all([
      listCatalogModules(),
      listComboPresets(),
      listAssessmentModeProfiles(),
      isFeatureEnabled("FEATURE_PROVISIONAL_PRECISION"),
      isFeatureEnabled("FEATURE_COMPLEX_MODE"),
    ]);
    const selectableModes = modeProfiles.map((profile) =>
      profile.internalMode === "deep" ? { ...profile, isSelectable: complexEnabled } : profile,
    );
    const result = estimateAssessment(parsed.data, modules, combos, selectableModes, {
      provisionalPrecisionEnabled: precisionEnabled,
    });

    return result.success
      ? NextResponse.json(apiSuccess(result.estimate), { headers: noStoreHeaders, status: 200 })
      : NextResponse.json(apiFailure(result.code), { headers: noStoreHeaders, status: 422 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

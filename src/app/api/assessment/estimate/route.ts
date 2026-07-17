import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { estimateAssessment } from "@/lib/assessment/estimate";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { estimateAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getMinimumModuleCoverage, loadComposerCandidates } from "@/server/repositories/blueprints";
import {
  isFeatureEnabled,
  listAssessmentModeProfiles,
  listCatalogModules,
  listComboPresets,
} from "@/server/repositories/catalog";
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
  const parsed = await parseJsonRequest(request, estimateAssessmentSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

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

    const [modules, combos, modeProfiles, modularEnabled, precisionEnabled, complexEnabled] =
      await Promise.all([
        listCatalogModules(),
        listComboPresets(),
        listAssessmentModeProfiles(),
        isFeatureEnabled("FEATURE_MODULAR_COMPOSER"),
        isFeatureEnabled("FEATURE_PROVISIONAL_PRECISION"),
        isFeatureEnabled("FEATURE_COMPLEX_MODE"),
      ]);
    if (!modularEnabled) {
      return NextResponse.json(apiFailure("feature_unavailable"), {
        headers: noStoreHeaders,
        status: 404,
      });
    }
    const selectableModes = modeProfiles.map((profile) =>
      profile.internalMode === "deep" ? { ...profile, isSelectable: complexEnabled } : profile,
    );
    const candidates = await loadComposerCandidates(parsed.data.moduleKeys);
    const result = estimateAssessment(parsed.data, modules, combos, selectableModes, {
      minimumCoverage: getMinimumModuleCoverage(candidates),
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

import { NextResponse } from "next/server";
import crypto from "node:crypto";

import { DatabaseTimeoutError, withDeadline } from "@/lib/async/with-deadline";
import { hasAssessmentCandidateCapacity } from "@/lib/assessment/composer";
import { estimateAssessment } from "@/lib/assessment/estimate";
import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { estimateAssessmentSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { elapsedMilliseconds, logOperationalEvent } from "@/server/observability";
import { getMinimumModuleCoverage, loadComposerCandidates } from "@/server/repositories/blueprints";
import {
  isFeatureEnabledBatch,
  listAssessmentModeProfilesFromCache,
  listCatalogModulesFromCache,
  listComboPresetsFromCache,
} from "@/server/repositories/catalog-cache";
import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

const ESTIMATE_DB_DEADLINE_MS = 5_000;

async function loadEstimateContext(
  moduleKeys: readonly string[],
  correlationId: string,
): Promise<{
  candidates: ReturnType<typeof loadComposerCandidates> extends Promise<infer T> ? T : never;
  combos: ReturnType<typeof listComboPresetsFromCache> extends Promise<infer T> ? T : never;
  complexEnabled: boolean;
  modeProfiles: ReturnType<typeof listAssessmentModeProfilesFromCache> extends Promise<infer T>
    ? T
    : never;
  modularEnabled: boolean;
  modules: ReturnType<typeof listCatalogModulesFromCache> extends Promise<infer T> ? T : never;
  precisionEnabled: boolean;
}> {
  const startCatalog = process.hrtime.bigint();
  const [modules, combos, modeProfiles, featureFlags, candidates] = await Promise.all([
    listCatalogModulesFromCache(),
    listComboPresetsFromCache(),
    listAssessmentModeProfilesFromCache(),
    isFeatureEnabledBatch([
      "FEATURE_MODULAR_COMPOSER",
      "FEATURE_PROVISIONAL_PRECISION",
      "FEATURE_COMPLEX_MODE",
    ]),
    loadComposerCandidates(moduleKeys),
  ]);
  logOperationalEvent({
    correlationId,
    durationMs: elapsedMilliseconds(startCatalog),
    operation: "estimate_catalog_queries",
    status: "success",
  });

  return {
    candidates,
    combos,
    complexEnabled: featureFlags["FEATURE_COMPLEX_MODE"] ?? false,
    modeProfiles,
    modularEnabled: featureFlags["FEATURE_MODULAR_COMPOSER"] ?? false,
    modules,
    precisionEnabled: featureFlags["FEATURE_PROVISIONAL_PRECISION"] ?? false,
  };
}

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

  const parsed = await parseJsonRequest(request, estimateAssessmentSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }

  const startRateLimit = process.hrtime.bigint();
  let limited: Awaited<ReturnType<typeof consumeRateLimit>> = {
    allowed: true,
    retryAfterSeconds: 0,
  };
  try {
    limited = await consumeRateLimit(
      getRequestRateLimitIdentity(request),
      assessmentRateLimitPolicies.estimate,
      environment.rateLimitSecret,
    );
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startRateLimit),
      operation: "estimate_rate_limit",
      status: limited.allowed ? "success" : "rate_limited",
    });
  } catch {
    // Fail-open for estimate only: preview math must stay available when the
    // rate-limit table is contended. Start/complete still fail closed.
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startRateLimit),
      errorCode: "rate_limiter_error",
      operation: "estimate_rate_limit",
      // Fail-open continues; mark as rejected so ops still sees the degraded path.
      status: "rejected",
    });
  }

  if (!limited.allowed) {
    return NextResponse.json(apiFailure("rate_limited"), {
      headers: { ...noStoreHeaders, "Retry-After": String(limited.retryAfterSeconds) },
      status: 429,
    });
  }

  const startTotal = process.hrtime.bigint();
  try {
    const context = await withDeadline(
      loadEstimateContext(parsed.data.moduleKeys, correlationId),
      ESTIMATE_DB_DEADLINE_MS,
    );

    if (!context.modularEnabled) {
      return NextResponse.json(apiFailure("feature_unavailable"), {
        headers: noStoreHeaders,
        status: 404,
      });
    }

    const selectableModes = context.modeProfiles.map((profile) =>
      profile.internalMode === "deep"
        ? { ...profile, isSelectable: context.complexEnabled }
        : profile,
    );
    const result = estimateAssessment(
      parsed.data,
      context.modules,
      context.combos,
      selectableModes,
      {
        minimumCoverage: getMinimumModuleCoverage(context.candidates, parsed.data.mode),
        provisionalPrecisionEnabled: context.precisionEnabled,
      },
    );
    if (result.success && !hasAssessmentCandidateCapacity(context.candidates, result.estimate)) {
      return NextResponse.json(apiFailure("module_unavailable"), {
        headers: noStoreHeaders,
        status: 422,
      });
    }

    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startTotal),
      operation: "estimate_computation",
      status: "success",
    });

    return result.success
      ? NextResponse.json(apiSuccess(result.estimate), { headers: noStoreHeaders, status: 200 })
      : NextResponse.json(apiFailure(result.code), { headers: noStoreHeaders, status: 422 });
  } catch (error) {
    const safeError = error instanceof DatabaseTimeoutError ? "database_timeout" : "database_error";
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startTotal),
      errorCode: safeError,
      operation: "estimate_computation",
      status: "failure",
    });

    if (error instanceof DatabaseTimeoutError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "service_temporarily_busy" },
          message: "Sistem sedang sibuk. Coba lagi beberapa saat.",
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

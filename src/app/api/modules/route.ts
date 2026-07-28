import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { isFeatureEnabled } from "@/server/repositories/catalog";
import {
  listAssessmentModeProfilesFromCache,
  listCatalogModulesFromCache,
} from "@/server/repositories/catalog-cache";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const [modules, modes, modularEnabled, complexEnabled] = await Promise.all([
      listCatalogModulesFromCache(),
      listAssessmentModeProfilesFromCache(),
      isFeatureEnabled("FEATURE_MODULAR_COMPOSER"),
      isFeatureEnabled("FEATURE_COMPLEX_MODE"),
    ]);
    if (!modularEnabled) {
      return NextResponse.json(apiFailure("feature_unavailable"), {
        headers: noStoreHeaders,
        status: 404,
      });
    }
    const publicModes = modes.map((profile) =>
      profile.internalMode === "deep" ? { ...profile, isSelectable: complexEnabled } : profile,
    );
    return NextResponse.json(apiSuccess({ modes: publicModes, modules }), {
      headers: noStoreHeaders,
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { isFeatureEnabled, listComboPresets } from "@/server/repositories/catalog";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const [combos, modularEnabled, complexEnabled] = await Promise.all([
      listComboPresets(),
      isFeatureEnabled("FEATURE_MODULAR_COMPOSER"),
      isFeatureEnabled("FEATURE_COMPLEX_MODE"),
    ]);
    if (!modularEnabled) {
      return NextResponse.json(apiFailure("feature_unavailable"), {
        headers: noStoreHeaders,
        status: 404,
      });
    }
    return NextResponse.json(
      apiSuccess({
        combos: complexEnabled ? combos : combos.filter((combo) => !combo.isFullSpectrum),
      }),
      { headers: noStoreHeaders, status: 200 },
    );
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

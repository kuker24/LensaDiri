import { NextResponse } from "next/server";

import { withDeadline } from "@/lib/async/with-deadline";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import {
  isFeatureEnabledBatch,
  listComboPresetsFromCache,
} from "@/server/repositories/catalog-cache";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const [combos, flags] = await withDeadline(
      Promise.all([
        listComboPresetsFromCache(),
        isFeatureEnabledBatch(["FEATURE_MODULAR_COMPOSER", "FEATURE_COMPLEX_MODE"]),
      ]),
      6_000,
    );
    if (!flags.FEATURE_MODULAR_COMPOSER) {
      return NextResponse.json(apiFailure("feature_unavailable"), {
        headers: noStoreHeaders,
        status: 404,
      });
    }
    return NextResponse.json(
      apiSuccess({
        combos: flags.FEATURE_COMPLEX_MODE
          ? combos
          : combos.filter((combo) => combo.recommendedMode !== "deep"),
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

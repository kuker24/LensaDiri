import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { listCatalogModules, listAssessmentModeProfiles } from "@/server/repositories/catalog";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const [modules, modes] = await Promise.all([
      listCatalogModules(),
      listAssessmentModeProfiles(),
    ]);
    return NextResponse.json(apiSuccess({ modes, modules }), {
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

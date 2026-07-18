import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import {
  listAssessmentModeProfilesFromCache,
  listCatalogModulesFromCache,
} from "@/server/repositories/catalog-cache";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const [modules, modes] = await Promise.all([
      listCatalogModulesFromCache(),
      listAssessmentModeProfilesFromCache(),
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

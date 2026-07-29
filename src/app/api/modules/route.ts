import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, noStoreHeaders } from "@/server/http";
import { getPublicAssessmentCatalog } from "@/server/public-assessment-catalog";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const catalog = await getPublicAssessmentCatalog();
  return catalog
    ? NextResponse.json(apiSuccess(catalog), { status: 200 })
    : NextResponse.json(apiFailure("feature_unavailable"), {
        headers: noStoreHeaders,
        status: 404,
      });
}

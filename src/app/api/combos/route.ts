import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { listComboPresets } from "@/server/repositories/catalog";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const combos = await listComboPresets();
    return NextResponse.json(apiSuccess({ combos }), { headers: noStoreHeaders, status: 200 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

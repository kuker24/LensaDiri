import { NextResponse } from "next/server";

import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getCatalogModuleByKey } from "@/server/repositories/catalog";

export const runtime = "nodejs";

const moduleKeyPattern = /^[a-z0-9_]{2,40}$/u;

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> },
): Promise<NextResponse> {
  const { key } = await context.params;
  if (!moduleKeyPattern.test(key)) {
    return NextResponse.json(apiFailure("not_found"), {
      headers: noStoreHeaders,
      status: 404,
    });
  }

  try {
    const catalogModule = await getCatalogModuleByKey(key);
    return catalogModule
      ? NextResponse.json(apiSuccess(catalogModule), { headers: noStoreHeaders, status: 200 })
      : NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

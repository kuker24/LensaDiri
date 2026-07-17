import { NextResponse } from "next/server";

import { getServerEnvironment } from "@/lib/db/env";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { opaqueTokenSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getAssessmentSessionByHash } from "@/server/repositories/assessment";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await context.params;
  if (!opaqueTokenSchema.safeParse(token).success)
    return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  const environment = getServerEnvironment();
  try {
    const session = await getAssessmentSessionByHash(
      hashOpaqueToken(token, environment.tokenHashPepper),
    );
    return session
      ? NextResponse.json(apiSuccess(session), { headers: noStoreHeaders, status: 200 })
      : NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

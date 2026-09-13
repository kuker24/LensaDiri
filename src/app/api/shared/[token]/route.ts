import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/db/env";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { opaqueTokenSchema } from "@/lib/validation/assessment";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { getSharedResultByHash } from "@/server/repositories/assessment";
import { isJourneyAttachedShareHash } from "@/server/repositories/identity-journeys";
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
    const shareHash = hashOpaqueToken(token, environment.tokenHashPepper);
    // Identity-journey cutover: pre-cutover share links no longer render.
    if (!(await isJourneyAttachedShareHash(shareHash))) {
      return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
    }
    const result = await getSharedResultByHash(shareHash);
    return result
      ? NextResponse.json(apiSuccess(result), { headers: noStoreHeaders })
      : NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}

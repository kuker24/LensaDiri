import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/email";
import { getServerEnvironment } from "@/lib/db/env";
import { recoveryRequestSchema } from "@/lib/validation/auth";
import { apiFailure, apiSuccess, noStoreHeaders } from "@/server/http";
import { readTestRecoveryDelivery } from "@/server/email-transport";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.RECOVERY_TEST_TRANSPORT !== "1" ||
    !process.env.TEST_DATABASE_URL
  ) {
    return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  }
  getServerEnvironment();
  const url = new URL(request.url);
  const parsed = recoveryRequestSchema.safeParse({ email: url.searchParams.get("email") });
  const purpose = url.searchParams.get("purpose");
  if (!parsed.success || !["email_verification", "password_reset"].includes(purpose ?? "")) {
    return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  }
  const delivery = readTestRecoveryDelivery(
    normalizeEmail(parsed.data.email),
    purpose as "email_verification" | "password_reset",
  );
  return delivery
    ? NextResponse.json(apiSuccess({ token: delivery.token }), { headers: noStoreHeaders })
    : NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
}

import { NextResponse } from "next/server";
import * as oauth from "oauth4webapi";
import { z } from "zod";

import { getOidcCookieName, getOidcCookieOptions, sealOidcTransaction } from "@/lib/auth/oidc";
import { getServerEnvironment } from "@/lib/db/env";
import { isValidCsrfMutation } from "@/lib/security/csrf";
import { parseJsonRequest } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { getCurrentSession } from "@/server/current-session";
import { findAccountByIdForAuthentication } from "@/server/repositories/accounts";
import { listAccountOidcProviders } from "@/server/repositories/oidc-identities";
import { createOidcAuthorizationUrl } from "@/server/services/oidc";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";
import { apiFailure, apiSuccess, noStoreHeaders } from "@/server/http";

export const runtime = "nodejs";

const requestSchema = z.object({ confirmation: z.literal("HAPUS AKUN") }).strict();

export async function POST(request: Request): Promise<NextResponse> {
  const environment = getServerEnvironment();
  if (
    !isValidCsrfMutation(
      request,
      environment.appOrigin,
      environment.csrfSecret,
      environment.isProduction,
    )
  ) {
    return NextResponse.json(apiFailure("csrf_invalid"), { headers: noStoreHeaders, status: 403 });
  }
  const parsed = await parseJsonRequest(request, requestSchema);
  if (!parsed.success) {
    return NextResponse.json(apiFailure(parsed.reason), { headers: noStoreHeaders, status: 400 });
  }
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(apiFailure("authentication_required"), {
      headers: noStoreHeaders,
      status: 401,
    });
  }
  const limited = await consumeRateLimit(
    `${getRequestRateLimitIdentity(request)}:${session.sessionId}`,
    authRateLimitPolicies.accountDelete,
    environment.rateLimitSecret,
  );
  if (!limited.allowed) {
    return NextResponse.json(apiFailure("rate_limited"), {
      headers: { ...noStoreHeaders, "Retry-After": limited.retryAfterSeconds.toString() },
      status: 429,
    });
  }
  const [account, providers] = await Promise.all([
    findAccountByIdForAuthentication(session.accountId),
    listAccountOidcProviders(session.accountId),
  ]);
  if (account?.passwordHash !== null || !providers.includes("google")) {
    return NextResponse.json(apiFailure("invalid_request"), {
      headers: noStoreHeaders,
      status: 400,
    });
  }
  const transaction = {
    accountId: session.accountId,
    codeVerifier: oauth.generateRandomCodeVerifier(),
    expiresAt: Date.now() + 10 * 60 * 1_000,
    nonce: oauth.generateRandomNonce(),
    operation: "delete" as const,
    provider: "google" as const,
    redirectTo: "/",
    sessionId: session.sessionId,
    state: oauth.generateRandomState(),
  };
  try {
    const authorizationUrl = await createOidcAuthorizationUrl(transaction, environment);
    const response = NextResponse.json(apiSuccess({ authorizationUrl: authorizationUrl.href }), {
      headers: noStoreHeaders,
    });
    response.cookies.set(
      getOidcCookieName("google", environment.isProduction),
      sealOidcTransaction(transaction, environment.authSessionSecret),
      getOidcCookieOptions(environment.isProduction),
    );
    return response;
  } catch {
    return NextResponse.json(apiFailure("provider_unavailable"), {
      headers: noStoreHeaders,
      status: 503,
    });
  }
}

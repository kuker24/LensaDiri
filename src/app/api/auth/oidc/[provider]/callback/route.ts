import { NextResponse } from "next/server";

import {
  getOidcCookieName,
  getOidcCookieOptions,
  isOidcProvider,
  openOidcTransaction,
} from "@/lib/auth/oidc";
import { SESSION_DURATION_MS, createSessionCookie } from "@/lib/auth/session";
import { getServerEnvironment } from "@/lib/db/env";
import { getCookieValue } from "@/lib/security/http";
import { getRequestRateLimitIdentity } from "@/lib/security/rate-limit";
import { findOidcAccount, linkOidcIdentity } from "@/server/repositories/oidc-identities";
import { createLoginSessionWithAudit } from "@/server/repositories/sessions";
import { exchangeOidcCode } from "@/server/services/oidc";
import { authRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

async function callback(
  request: Request,
  context: { params: Promise<{ provider: string }> },
  parameters: URLSearchParams,
): Promise<NextResponse> {
  const { provider } = await context.params;
  if (!isOidcProvider(provider)) return new NextResponse(null, { status: 404 });
  const environment = getServerEnvironment();
  const cookieName = getOidcCookieName(provider, environment.isProduction);
  const sealed = getCookieValue(request.headers.get("cookie"), cookieName);
  const transaction = sealed ? openOidcTransaction(sealed, environment.authSessionSecret) : null;
  const errorDestination = new URL("/login?authError=provider_failed", environment.appOrigin);
  let destination = errorDestination;
  let session: { expiresAt: Date; token: string } | null = null;
  try {
    const rateLimit = await consumeRateLimit(
      `${provider}:oidc-callback:${getRequestRateLimitIdentity(request)}`,
      authRateLimitPolicies.oidcCallback,
      environment.rateLimitSecret,
    );
    if (!rateLimit.allowed) throw new Error("OIDC callback rate limited.");
    for (const name of ["code", "state", "error"]) {
      if (parameters.getAll(name).length > 1) throw new Error("OIDC response invalid.");
    }
    if (!transaction || transaction.provider !== provider) throw new Error("OIDC state invalid.");
    const identity = await exchangeOidcCode({ environment, parameters, transaction });
    if (transaction.operation === "link") {
      if (!transaction.accountId || !transaction.sessionId) throw new Error("OIDC link invalid.");
      if (
        !(await linkOidcIdentity({
          ...identity,
          accountId: transaction.accountId,
          provider,
          sessionId: transaction.sessionId,
        }))
      ) {
        throw new Error("OIDC link failed.");
      }
      destination = new URL("/dashboard/settings?authLinked=1", environment.appOrigin);
    } else {
      const accountId = await findOidcAccount({
        ...identity,
        provider,
        requireEmailVerification: environment.requireEmailVerification,
      });
      if (!accountId) throw new Error("OIDC identity unknown.");
      session = await createLoginSessionWithAudit({
        accountId,
        authenticatedWith: provider,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
        fingerprint: {
          ip: getRequestRateLimitIdentity(request),
          userAgent: request.headers.get("user-agent") ?? "",
        },
        secrets: {
          authSessionSecret: environment.authSessionSecret,
          tokenHashPepper: environment.tokenHashPepper,
        },
      });
      destination = new URL(transaction.redirectTo, environment.appOrigin);
    }
  } catch {
    destination = errorDestination;
  }
  const response = NextResponse.redirect(destination);
  response.cookies.set(cookieName, "", getOidcCookieOptions(environment.isProduction, true));
  if (session) {
    const cookie = createSessionCookie(session.token, session.expiresAt, environment.isProduction);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  return callback(request, context, new URL(request.url).searchParams);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  if (
    request.headers.get("content-type")?.split(";", 1)[0] !== "application/x-www-form-urlencoded"
  ) {
    return new NextResponse(null, { status: 400 });
  }
  const reader = request.body?.getReader();
  if (!reader) return new NextResponse(null, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 8_192) {
      await reader.cancel();
      return new NextResponse(null, { status: 413 });
    }
    chunks.push(value);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  return callback(request, context, new URLSearchParams(body));
}

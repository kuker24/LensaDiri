import "server-only";

import crypto from "node:crypto";

import { cookies } from "next/headers";

import { getSessionCookieName, isOpaqueSessionToken } from "@/lib/auth/session";
import { DatabaseError } from "@/lib/db/errors";
import { getServerEnvironment } from "@/lib/db/env";
import { elapsedMilliseconds, logOperationalEvent } from "@/server/observability";
import { getActiveSession } from "@/server/services/auth";

export async function getCurrentSession(): Promise<Awaited<
  ReturnType<typeof getActiveSession>
> | null> {
  const environment = getServerEnvironment();
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName(environment.isProduction))?.value;
  if (!token || !isOpaqueSessionToken(token)) {
    return null;
  }

  const correlationId = crypto.randomUUID();
  const startedAt = process.hrtime.bigint();
  try {
    const session = await getActiveSession(
      token,
      environment.tokenHashPepper,
      new Date(),
      correlationId,
    );
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startedAt),
      operation: "current_session",
      status: session ? "found" : "not_found",
    });
    return session;
  } catch (error) {
    logOperationalEvent({
      correlationId,
      durationMs: elapsedMilliseconds(startedAt),
      errorCode: error instanceof DatabaseError ? "database_error" : undefined,
      operation: "current_session",
      status: "error",
    });
    throw error;
  }
}

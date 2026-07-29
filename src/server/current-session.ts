import "server-only";

import { cookies } from "next/headers";

import { withDeadline } from "@/lib/async/with-deadline";
import { getSessionCookieName, isOpaqueSessionToken } from "@/lib/auth/session";
import { getServerEnvironment } from "@/lib/db/env";
import { getActiveSession } from "@/server/services/auth";

const SESSION_READ_DEADLINE_MS = 5_000;

export async function getCurrentSession(): Promise<Awaited<
  ReturnType<typeof getActiveSession>
> | null> {
  const environment = getServerEnvironment();
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName(environment.isProduction))?.value;
  if (!token || !isOpaqueSessionToken(token)) {
    return null;
  }
  return withDeadline(
    getActiveSession(token, environment.tokenHashPepper),
    SESSION_READ_DEADLINE_MS,
  );
}

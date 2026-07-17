import "server-only";

import { cookies } from "next/headers";

import { getSessionCookieName, isOpaqueSessionToken } from "@/lib/auth/session";
import { getServerEnvironment } from "@/lib/db/env";
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
  return getActiveSession(token, environment.tokenHashPepper);
}

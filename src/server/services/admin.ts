import "server-only";

import { getCurrentSession } from "@/server/current-session";
import type { AccountRole } from "@/server/repositories/accounts";

export type { AccountRole };

export type AdminSession = {
  accountId: string;
  role: Extract<AccountRole, "admin" | "super_admin">;
};

/**
 * Fail-closed guard for protected admin areas. Returns null for unauthenticated
 * or non-privileged callers; route handlers must redirect to /dashboard or
 * return 403 when this returns null.
 */
export async function requireAdminSession(): Promise<AdminSession | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const account = await import("@/server/repositories/accounts").then((repo) =>
    repo.findAccountByIdForAuthentication(session.accountId),
  );
  if (!account) return null;

  if (account.role !== "admin" && account.role !== "super_admin") return null;

  return { accountId: account.id, role: account.role };
}

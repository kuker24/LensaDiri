import "server-only";

import { getDatabase } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

import type { AccountStatus } from "@/server/repositories/accounts";

export type ActiveSessionRecord = {
  accountId: string;
  accountStatus: AccountStatus;
  expiresAt: Date;
  revokedAt: Date | null;
  sessionId: string;
};

export async function createAccountSession(input: {
  accountId: string;
  expiresAt: Date;
  ipHash: string | null;
  sessionTokenHash: string;
  userAgentHash: string | null;
}): Promise<{ id: string }> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [session] = await sql<{ id: string }[]>`
      insert into public.account_sessions (
        account_id,
        session_token_hash,
        user_agent_hash,
        ip_hash,
        expires_at,
        last_seen_at
      )
      values (
        ${input.accountId},
        ${input.sessionTokenHash},
        ${input.userAgentHash},
        ${input.ipHash},
        ${input.expiresAt},
        now()
      )
      returning id
    `;

    if (!session) {
      throw new Error("Session insert returned no row.");
    }

    return session;
  });
}

export async function findSessionByTokenHash(
  tokenHash: string,
): Promise<ActiveSessionRecord | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [session] = await sql<
      {
        account_id: string;
        account_status: AccountStatus;
        expires_at: Date;
        revoked_at: Date | null;
        session_id: string;
      }[]
    >`
      select
        account_sessions.id as session_id,
        account_sessions.account_id,
        account_sessions.expires_at,
        account_sessions.revoked_at,
        accounts.status as account_status
      from public.account_sessions
      inner join public.accounts on accounts.id = account_sessions.account_id
      where account_sessions.session_token_hash = ${tokenHash}
      limit 1
    `;

    return session
      ? {
          accountId: session.account_id,
          accountStatus: session.account_status,
          expiresAt: session.expires_at,
          revokedAt: session.revoked_at,
          sessionId: session.session_id,
        }
      : null;
  });
}

export async function revokeAccountSession(
  tokenHash: string,
  revokedAt = new Date(),
): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      update public.account_sessions
      set revoked_at = ${revokedAt}
      where session_token_hash = ${tokenHash}
        and revoked_at is null
    `;
    return rows.count > 0;
  });
}

export async function touchAccountSession(tokenHash: string, seenAt = new Date()): Promise<void> {
  await runDatabaseOperation(async () => {
    const sql = getDatabase();
    await sql`
      update public.account_sessions
      set last_seen_at = ${seenAt}
      where session_token_hash = ${tokenHash}
        and revoked_at is null
        and expires_at > ${seenAt}
    `;
  });
}

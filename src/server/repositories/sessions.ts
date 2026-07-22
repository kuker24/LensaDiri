import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { runDatabaseOperation } from "@/server/database";
import { elapsedMilliseconds, logOperationalEvent } from "@/server/observability";

import type { AccountStatus } from "@/server/repositories/accounts";

export type ActiveSessionRecord = {
  accountId: string;
  accountStatus: AccountStatus;
  expiresAt: Date;
  lastSeenAt: Date | null;
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
  correlationId?: string,
): Promise<ActiveSessionRecord | null> {
  return runDatabaseOperation(async () => {
    const startedAt = process.hrtime.bigint();
    const sql = getDatabase();
    const [session] = await sql<
      {
        account_id: string;
        account_status: AccountStatus;
        expires_at: Date;
        last_seen_at: Date | null;
        revoked_at: Date | null;
        session_id: string;
      }[]
    >`
      select
        account_sessions.id as session_id,
        account_sessions.account_id,
        account_sessions.expires_at,
        account_sessions.last_seen_at,
        account_sessions.revoked_at,
        accounts.status as account_status
      from public.account_sessions
      inner join public.accounts on accounts.id = account_sessions.account_id
      where account_sessions.session_token_hash = ${tokenHash}
      limit 1
    `;

    if (correlationId) {
      logOperationalEvent({
        correlationId,
        durationMs: elapsedMilliseconds(startedAt),
        operation: "session_read",
        status: "success",
      });
    }

    return session
      ? {
          accountId: session.account_id,
          accountStatus: session.account_status,
          expiresAt: session.expires_at,
          lastSeenAt: session.last_seen_at,
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

export async function createLoginSessionWithAudit(input: {
  accountId: string;
  correlationId?: string;
  expiresAt: Date;
  fingerprint: { ip: string; userAgent: string };
  secrets: { authSessionSecret: string; tokenHashPepper: string };
}): Promise<{ expiresAt: Date; token: string }> {
  return runDatabaseOperation(async () => {
    return withTransaction(async (tx) => {
      await tx`set local statement_timeout = 2000`;
      await tx`set local lock_timeout = 1000`;

      const token = generateOpaqueToken();
      const sessionTokenHash = hashOpaqueToken(token, input.secrets.tokenHashPepper);
      const ipHash = input.fingerprint.ip
        ? hashOpaqueToken(input.fingerprint.ip, input.secrets.authSessionSecret)
        : null;
      const userAgentHash = input.fingerprint.userAgent
        ? hashOpaqueToken(input.fingerprint.userAgent, input.secrets.authSessionSecret)
        : null;

      const startSessionInsert = process.hrtime.bigint();
      let sessionRow;
      try {
        [sessionRow] = await tx<{ id: string; account_id: string; expires_at: Date }[]>`
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
            ${sessionTokenHash},
            ${userAgentHash},
            ${ipHash},
            ${input.expiresAt},
            now()
          )
          returning id, account_id, expires_at
        `;
        if (input.correlationId) {
          logOperationalEvent({
            correlationId: input.correlationId,
            durationMs: elapsedMilliseconds(startSessionInsert),
            operation: "login_session_insert",
            status: "success",
          });
        }
      } catch (error) {
        if (input.correlationId) {
          logOperationalEvent({
            correlationId: input.correlationId,
            durationMs: elapsedMilliseconds(startSessionInsert),
            operation: "login_session_insert",
            status: "error",
          });
        }
        throw error;
      }

      if (!sessionRow) {
        throw new Error("Session insert returned no row.");
      }

      const startAuditInsert = process.hrtime.bigint();
      try {
        await tx`
          insert into public.audit_logs (actor_account_id, action, entity_type, entity_id, metadata_json)
          values (${input.accountId}, 'account_login_succeeded', 'account', ${input.accountId}, ${tx.json({ outcome: "authenticated" })})`;
        if (input.correlationId) {
          logOperationalEvent({
            correlationId: input.correlationId,
            durationMs: elapsedMilliseconds(startAuditInsert),
            operation: "login_audit_insert",
            status: "success",
          });
        }
      } catch (error) {
        if (input.correlationId) {
          logOperationalEvent({
            correlationId: input.correlationId,
            durationMs: elapsedMilliseconds(startAuditInsert),
            operation: "login_audit_insert",
            status: "error",
          });
        }
        throw error;
      }

      return {
        expiresAt: sessionRow.expires_at,
        token,
      };
    });
  });
}

export async function touchAccountSession(
  tokenHash: string,
  seenAt = new Date(),
  correlationId?: string,
): Promise<void> {
  const staleBefore = new Date(seenAt.getTime() - 10 * 60 * 1000);
  await runDatabaseOperation(async () => {
    const startedAt = process.hrtime.bigint();
    const sql = getDatabase();
    const result = await sql`
      update public.account_sessions
      set last_seen_at = ${seenAt}
      where session_token_hash = ${tokenHash}
        and revoked_at is null
        and expires_at > ${seenAt}
        and (last_seen_at is null or last_seen_at < ${staleBefore})
    `;
    if (correlationId) {
      logOperationalEvent({
        correlationId,
        durationMs: elapsedMilliseconds(startedAt),
        operation: "session_touch",
        status: "success",
        wrote: result.count > 0,
      });
    }
  });
}

export async function findAndTouchActiveSession(
  tokenHash: string,
  now = new Date(),
  correlationId?: string,
): Promise<ActiveSessionRecord | null> {
  return runDatabaseOperation(async () => {
    const database = getDatabase();
    const poolStartedAt = process.hrtime.bigint();
    const sql = await database.reserve();
    if (correlationId) {
      logOperationalEvent({
        correlationId,
        durationMs: elapsedMilliseconds(poolStartedAt),
        operation: "pool_wait",
        status: "success",
      });
    }

    try {
      const readStartedAt = process.hrtime.bigint();
      const [session] = await sql<
        {
          account_id: string;
          account_status: AccountStatus;
          expires_at: Date;
          last_seen_at: Date | null;
          revoked_at: Date | null;
          session_id: string;
        }[]
      >`
        select
          account_sessions.id as session_id,
          account_sessions.account_id,
          account_sessions.expires_at,
          account_sessions.last_seen_at,
          account_sessions.revoked_at,
          accounts.status as account_status
        from public.account_sessions
        inner join public.accounts on accounts.id = account_sessions.account_id
        where account_sessions.session_token_hash = ${tokenHash}
        limit 1
      `;
      if (correlationId) {
        logOperationalEvent({
          correlationId,
          durationMs: elapsedMilliseconds(readStartedAt),
          operation: "session_read",
          status: "success",
        });
      }

      if (
        !session ||
        session.account_status !== "active" ||
        session.revoked_at !== null ||
        session.expires_at <= now
      ) {
        return null;
      }

      const staleBefore = new Date(now.getTime() - 10 * 60 * 1000);
      if (!session.last_seen_at || session.last_seen_at < staleBefore) {
        const touchStartedAt = process.hrtime.bigint();
        const result = await sql`
          update public.account_sessions
          set last_seen_at = ${now}
          where id = ${session.session_id}
            and revoked_at is null
            and expires_at > ${now}
            and (last_seen_at is null or last_seen_at < ${staleBefore})
        `;
        if (correlationId) {
          logOperationalEvent({
            correlationId,
            durationMs: elapsedMilliseconds(touchStartedAt),
            operation: "session_touch",
            status: "success",
            wrote: result.count > 0,
          });
        }
      }

      return {
        accountId: session.account_id,
        accountStatus: session.account_status,
        expiresAt: session.expires_at,
        lastSeenAt: session.last_seen_at,
        revokedAt: session.revoked_at,
        sessionId: session.session_id,
      };
    } finally {
      sql.release();
    }
  });
}

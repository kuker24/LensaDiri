import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";
import type { AuditMetadata } from "@/server/repositories/audit-logs";

export type AccountRole = "user" | "admin" | "super_admin";
export type AccountStatus = "active" | "suspended" | "deleted";

export type AccountAuthenticationRecord = {
  id: string;
  passwordHash: string;
  role: AccountRole;
  status: AccountStatus;
};

export type CreatedAccount = {
  id: string;
};

export async function createAccount(input: {
  email: string;
  emailNormalized: string;
  passwordHash: string;
}): Promise<CreatedAccount> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [account] = await sql<{ id: string }[]>`
      insert into public.accounts (email, email_normalized, password_hash)
      values (${input.email}, ${input.emailNormalized}, ${input.passwordHash})
      returning id
    `;

    if (!account) {
      throw new Error("Account insert returned no row.");
    }

    return account;
  });
}

// Atomic account creation with its registration audit log. Both writes share one
// transaction with tight local timeouts, so a slow/contended audit insert can
// never leave a registered account without its audit record (the orphan case) --
// either both rows commit or the whole transaction rolls back.
// `correlationId` is optional and used only for safe, non-sensitive per-phase
// timing telemetry (no email, password, or token value is ever logged).
export async function createAccountWithAudit(input: {
  email: string;
  emailNormalized: string;
  passwordHash: string;
  auditMetadata: AuditMetadata;
  correlationId?: string;
}): Promise<CreatedAccount> {
  return runDatabaseOperation(async () => {
    return withTransaction(async (tx) => {
      await tx`set local statement_timeout = 2000`;
      await tx`set local lock_timeout = 1000`;

      const startAccountInsert = process.hrtime.bigint();
      let account;
      try {
        [account] = await tx<{ id: string }[]>`
          insert into public.accounts (email, email_normalized, password_hash)
          values (${input.email}, ${input.emailNormalized}, ${input.passwordHash})
          returning id
        `;
        const endAccountInsert = process.hrtime.bigint();
        if (input.correlationId) {
          console.info(
            `[TELEMETRY] cid=${input.correlationId} op=register_account_insert duration_ms=${(Number(endAccountInsert - startAccountInsert) / 1_000_000).toFixed(2)} status=success`,
          );
        }
      } catch (error) {
        const endAccountInsert = process.hrtime.bigint();
        if (input.correlationId) {
          console.info(
            `[TELEMETRY] cid=${input.correlationId} op=register_account_insert duration_ms=${(Number(endAccountInsert - startAccountInsert) / 1_000_000).toFixed(2)} status=error`,
          );
        }
        throw error;
      }

      if (!account) {
        throw new Error("Account insert returned no row.");
      }

      const metadata = Object.fromEntries(
        Object.entries(input.auditMetadata).filter(([, value]) => value !== undefined),
      );
      const startAuditInsert = process.hrtime.bigint();
      try {
        await tx`
          insert into public.audit_logs (actor_account_id, action, entity_type, entity_id, metadata_json)
          values (${account.id}, 'account_registered', 'account', ${account.id}, ${tx.json(metadata)})
        `;
        const endAuditInsert = process.hrtime.bigint();
        if (input.correlationId) {
          console.info(
            `[TELEMETRY] cid=${input.correlationId} op=register_audit_insert duration_ms=${(Number(endAuditInsert - startAuditInsert) / 1_000_000).toFixed(2)} status=success`,
          );
        }
      } catch (error) {
        const endAuditInsert = process.hrtime.bigint();
        if (input.correlationId) {
          console.info(
            `[TELEMETRY] cid=${input.correlationId} op=register_audit_insert duration_ms=${(Number(endAuditInsert - startAuditInsert) / 1_000_000).toFixed(2)} status=error`,
          );
        }
        throw error;
      }

      return account;
    });
  });
}

function toAuthenticationRecord(account: {
  id: string;
  password_hash: string;
  role: AccountRole;
  status: AccountStatus;
}): AccountAuthenticationRecord {
  return {
    id: account.id,
    passwordHash: account.password_hash,
    role: account.role,
    status: account.status,
  };
}

export async function findAccountForAuthentication(
  emailNormalized: string,
): Promise<AccountAuthenticationRecord | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [account] = await sql<
      {
        id: string;
        password_hash: string;
        role: AccountRole;
        status: AccountStatus;
      }[]
    >`
      select id, password_hash, role, status
      from public.accounts
      where email_normalized = ${emailNormalized}
        and deleted_at is null
      limit 1
    `;

    return account ? toAuthenticationRecord(account) : null;
  });
}

export async function findAccountByIdForAuthentication(
  accountId: string,
): Promise<AccountAuthenticationRecord | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [account] = await sql<
      {
        id: string;
        password_hash: string;
        role: AccountRole;
        status: AccountStatus;
      }[]
    >`
      select id, password_hash, role, status
      from public.accounts
      where id = ${accountId}
        and deleted_at is null
      limit 1
    `;

    return account ? toAuthenticationRecord(account) : null;
  });
}

export async function hardDeleteAccountBySessionHash(sessionTokenHash: string): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [result] = await sql<{ deleted: boolean }[]>`
      select public.hard_delete_account_by_session(${sessionTokenHash}) as deleted
    `;

    return result?.deleted === true;
  });
}

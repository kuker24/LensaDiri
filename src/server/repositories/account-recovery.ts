import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

export type RecoveryPurpose = "email_verification" | "password_reset";

export type RecoveryAccount = {
  email: string;
  id: string;
  verified: boolean;
};

export async function findActiveRecoveryAccountByEmail(
  emailNormalized: string,
): Promise<RecoveryAccount | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [account] = await sql<{ email: string; email_verified_at: Date | null; id: string }[]>`
      select id, email, email_verified_at
      from public.accounts
      where email_normalized = ${emailNormalized}
        and status = 'active'
        and deleted_at is null
      limit 1
    `;
    return account
      ? { email: account.email, id: account.id, verified: account.email_verified_at !== null }
      : null;
  });
}

export async function issueRecoveryToken(input: {
  accountId: string;
  expiresAt: Date;
  purpose: RecoveryPurpose;
  tokenHash: string;
}): Promise<string> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [token] = await sql<{ id: string }[]>`
      insert into public.account_recovery_tokens (account_id, purpose, token_hash, expires_at)
      values (
        ${input.accountId}, ${input.purpose}::public.account_recovery_purpose,
        ${input.tokenHash}, ${input.expiresAt}
      )
      returning id
    `;
    if (!token) throw new Error("Recovery token insert did not return an id.");
    return token.id;
  });
}

export async function markRecoveryTokenDelivered(input: {
  accountId: string;
  purpose: RecoveryPurpose;
  tokenId: string;
}): Promise<void> {
  await runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      await sql`select id from public.accounts where id = ${input.accountId} for update`;
      await sql`
        update public.account_recovery_tokens
        set consumed_at = now()
        where account_id = ${input.accountId}
          and purpose = ${input.purpose}::public.account_recovery_purpose
          and id <> ${input.tokenId}
          and delivered_at is not null
          and consumed_at is null
      `;
      const updated = await sql`
        update public.account_recovery_tokens
        set delivered_at = now()
        where id = ${input.tokenId}
          and account_id = ${input.accountId}
          and purpose = ${input.purpose}::public.account_recovery_purpose
          and delivered_at is null
          and consumed_at is null
      `;
      if (updated.count !== 1) throw new Error("Recovery token could not be marked delivered.");
    }),
  );
}

export async function discardUndeliveredRecoveryToken(tokenId: string): Promise<void> {
  await runDatabaseOperation(async () => {
    const sql = getDatabase();
    await sql`
      delete from public.account_recovery_tokens
      where id = ${tokenId} and delivered_at is null and consumed_at is null
    `;
  });
}

export async function verifyEmailWithTokenHash(tokenHash: string): Promise<string | null> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [token] = await sql<{ account_id: string; id: string }[]>`
        select id, account_id
        from public.account_recovery_tokens
        where token_hash = ${tokenHash}
          and purpose = 'email_verification'
          and delivered_at is not null
          and consumed_at is null
          and expires_at > now()
        for update
      `;
      if (!token) return null;
      const updated = await sql`
        update public.accounts
        set email_verified_at = coalesce(email_verified_at, now())
        where id = ${token.account_id} and status = 'active' and deleted_at is null
      `;
      if (updated.count === 0) return null;
      await sql`
        update public.account_recovery_tokens set consumed_at = now() where id = ${token.id}
      `;
      return token.account_id;
    }),
  );
}

export async function resetPasswordWithTokenHash(input: {
  passwordHash: string;
  tokenHash: string;
}): Promise<string | null> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [token] = await sql<{ account_id: string; id: string }[]>`
        select id, account_id
        from public.account_recovery_tokens
        where token_hash = ${input.tokenHash}
          and purpose = 'password_reset'
          and delivered_at is not null
          and consumed_at is null
          and expires_at > now()
        for update
      `;
      if (!token) return null;
      const updated = await sql`
        update public.accounts
        set password_hash = ${input.passwordHash}
        where id = ${token.account_id} and status = 'active' and deleted_at is null
      `;
      if (updated.count === 0) return null;
      await sql`
        update public.account_recovery_tokens set consumed_at = now() where id = ${token.id}
      `;
      await sql`
        update public.account_sessions
        set revoked_at = now()
        where account_id = ${token.account_id}
          and revoked_at is null
      `;
      return token.account_id;
    }),
  );
}

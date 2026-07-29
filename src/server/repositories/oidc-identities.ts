import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
import type { OidcProvider } from "@/lib/auth/oidc";
import { normalizeEmail } from "@/lib/auth/email";
import { runDatabaseOperation } from "@/server/database";

export async function listAccountOidcProviders(accountId: string): Promise<OidcProvider[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<{ provider: OidcProvider }[]>`
      select provider from public.account_oidc_identities
      where account_id = ${accountId}
      order by provider
    `;
    return rows.map((row) => row.provider);
  });
}

export async function linkOidcIdentity(input: {
  accountId: string;
  issuer: string;
  provider: OidcProvider;
  sessionId: string;
  subject: string;
}): Promise<boolean> {
  return runDatabaseOperation(async () =>
    withTransaction(async (tx) => {
      await tx`set local statement_timeout = 2000`;
      await tx`set local lock_timeout = 1000`;
      const [account] = await tx<{ id: string }[]>`
        select account.id from public.accounts as account
        inner join public.account_sessions as session on session.account_id = account.id
        where account.id = ${input.accountId}
          and account.status = 'active'
          and account.deleted_at is null
          and session.id = ${input.sessionId}
          and session.authenticated_with = 'password'
          and session.revoked_at is null
          and session.expires_at > now()
        for update
      `;
      if (!account) return false;
      await tx`
        insert into public.account_oidc_identities (account_id, provider, issuer, subject)
        values (${input.accountId}, ${input.provider}, ${input.issuer}, ${input.subject})
      `;
      await tx`
        insert into public.audit_logs (actor_account_id, action, entity_type, entity_id, metadata_json)
        values (${input.accountId}, 'oidc_identity_linked', 'account', ${input.accountId}, ${tx.json({ source: input.provider })})
      `;
      return true;
    }),
  );
}

export async function findOidcAccount(input: {
  issuer: string;
  provider: OidcProvider;
  requireEmailVerification: boolean;
  subject: string;
}): Promise<string | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [identity] = await sql<{ account_id: string }[]>`
      update public.account_oidc_identities as identity
      set last_login_at = now()
      from public.accounts as account
      where identity.account_id = account.id
        and identity.provider = ${input.provider}
        and identity.issuer = ${input.issuer}
        and identity.subject = ${input.subject}
        and account.status = 'active'
        and account.deleted_at is null
        and (${input.requireEmailVerification} = false or account.email_verified_at is not null)
      returning identity.account_id
    `;
    return identity?.account_id ?? null;
  });
}

export async function resolveGoogleOidcAccount(input: {
  email: string;
  issuer: string;
  subject: string;
}): Promise<{ accountId: string | null; outcome: "collision" | "created" | "existing" }> {
  return runDatabaseOperation(async () =>
    withTransaction(async (tx) => {
      await tx`set local statement_timeout = 2000`;
      await tx`set local lock_timeout = 1000`;
      const emailNormalized = normalizeEmail(input.email);
      await tx`select pg_advisory_xact_lock(hashtextextended(${`google:${input.issuer}:${input.subject}`}, 0))`;
      await tx`select pg_advisory_xact_lock(hashtextextended(${emailNormalized}, 0))`;

      const [identity] = await tx<{ account_id: string }[]>`
        update public.account_oidc_identities as identity
        set last_login_at = now()
        from public.accounts as account
        where identity.account_id = account.id
          and identity.provider = 'google'
          and identity.issuer = ${input.issuer}
          and identity.subject = ${input.subject}
          and account.status = 'active'
          and account.deleted_at is null
        returning identity.account_id
      `;
      if (identity) {
        await tx`
          update public.accounts
          set email_verified_at = coalesce(email_verified_at, now())
          where id = ${identity.account_id}
        `;
        return { accountId: identity.account_id, outcome: "existing" };
      }

      const [emailOwner] = await tx<{ id: string }[]>`
        select id from public.accounts
        where email_normalized = ${emailNormalized} and deleted_at is null
        limit 1
      `;
      if (emailOwner) return { accountId: null, outcome: "collision" };

      const [account] = await tx<{ id: string }[]>`
        insert into public.accounts (email, email_normalized, password_hash, email_verified_at)
        values (${emailNormalized}, ${emailNormalized}, null, now())
        returning id
      `;
      if (!account) throw new Error("OIDC account insert returned no row.");
      await tx`
        insert into public.account_oidc_identities (account_id, provider, issuer, subject)
        values (${account.id}, 'google', ${input.issuer}, ${input.subject})
      `;
      await tx`
        insert into public.audit_logs (actor_account_id, action, entity_type, entity_id, metadata_json)
        values
          (${account.id}, 'account_registered', 'account', ${account.id}, ${tx.json({ outcome: "created", source: "google" })}),
          (${account.id}, 'oidc_identity_linked', 'account', ${account.id}, ${tx.json({ source: "google" })})
      `;
      return { accountId: account.id, outcome: "created" };
    }),
  );
}

export async function verifyOidcIdentityForAccount(input: {
  accountId: string;
  issuer: string;
  provider: OidcProvider;
  sessionId: string;
  subject: string;
}): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [identity] = await sql<{ id: string }[]>`
      select identity.id
      from public.account_oidc_identities as identity
      inner join public.accounts as account on account.id = identity.account_id
      inner join public.account_sessions as session on session.account_id = account.id
      where identity.account_id = ${input.accountId}
        and identity.provider = ${input.provider}
        and identity.issuer = ${input.issuer}
        and identity.subject = ${input.subject}
        and session.id = ${input.sessionId}
        and session.revoked_at is null
        and session.expires_at > now()
        and account.status = 'active'
        and account.deleted_at is null
        and account.password_hash is null
      limit 1
    `;
    return Boolean(identity);
  });
}

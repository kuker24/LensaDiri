import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
import type { OidcProvider } from "@/lib/auth/oidc";
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

-- Trusted-server-only account erasure. Browser roles cannot execute this function.
-- Password re-authentication and confirmation phrase validation remain application concerns.

alter table public.rate_limits
  drop constraint rate_limits_route_key;

alter table public.rate_limits
  add constraint rate_limits_route_key check (
    route_key in ('auth_register', 'auth_login', 'auth_session', 'auth_logout', 'account_delete')
  );

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE'
    and current_setting('lensadiri.account_hard_delete', true) = 'on'
  then
    return old;
  end if;

  raise exception 'audit logs are append-only' using errcode = '55000';
end;
$$;

comment on function public.prevent_audit_log_mutation() is
  'Rejects audit updates and deletes except deletion scoped inside trusted account hard-delete transaction.';

create function public.hard_delete_account_by_session(p_session_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_account_id uuid;
begin
  if p_session_token_hash is null
    or p_session_token_hash !~ '^[0-9a-f]{64}$'
  then
    return false;
  end if;

  select account_sessions.account_id
  into v_account_id
  from public.account_sessions
  inner join public.accounts
    on accounts.id = account_sessions.account_id
  where account_sessions.session_token_hash = p_session_token_hash
    and account_sessions.revoked_at is null
    and account_sessions.expires_at > statement_timestamp()
    and accounts.status = 'active'
    and accounts.deleted_at is null
  for update of accounts;

  if v_account_id is null then
    return false;
  end if;

  perform set_config('lensadiri.account_hard_delete', 'on', true);

  delete from public.audit_logs as audit_log
  where audit_log.actor_account_id = v_account_id
    or (
      audit_log.entity_type = 'account'
      and audit_log.entity_id = v_account_id
    )
    or (
      audit_log.entity_type = 'account_session'
      and exists (
        select 1
        from public.account_sessions as account_session
        where account_session.id = audit_log.entity_id
          and account_session.account_id = v_account_id
      )
    )
    or (
      audit_log.entity_type = 'consent'
      and exists (
        select 1
        from public.consents as consent
        where consent.id = audit_log.entity_id
          and consent.account_id = v_account_id
      )
    );

  delete from public.consents
  where account_id = v_account_id;

  delete from public.accounts
  where id = v_account_id;

  return found;
end;
$$;

comment on function public.hard_delete_account_by_session(text) is
  'Atomically deletes active account selected by HMAC session hash, including linked sessions, consents, and audit records.';

revoke all on function public.hard_delete_account_by_session(text) from public, anon, authenticated;

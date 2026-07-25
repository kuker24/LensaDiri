-- Rolling cleanup for published retention policy audit_security_event (365 days).
-- Extends existing retention functions; does not touch account-owned results.
-- Audit logs remain append-only except trusted hard-delete and this retention path.

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if tg_op = 'DELETE'
    and (
      current_setting('lensadiri.account_hard_delete', true) = 'on'
      or current_setting('lensadiri.retention_cleanup', true) = 'on'
    )
  then
    return old;
  end if;

  raise exception 'audit logs are append-only' using errcode = '55000';
end;
$$;

comment on function public.prevent_audit_log_mutation() is
  'Rejects audit updates and deletes except deletion scoped inside trusted account hard-delete or retention-cleanup transactions.';

create or replace function public.preview_expired_retention_data(reference_time timestamptz default now())
returns table (resource text, eligible_count bigint)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select 'guest_sessions'::text, count(*)::bigint
  from public.test_sessions
  where account_id is null
    and status in ('active', 'paused', 'expired', 'revoked')
    and expires_at <= reference_time
  union all
  select 'rate_limits'::text, count(*)::bigint
  from public.rate_limits
  where window_start < reference_time - interval '90 days'
  union all
  select 'audit_security_events'::text, count(*)::bigint
  from public.audit_logs
  where created_at < reference_time - interval '365 days';
$$;

create or replace function public.cleanup_expired_retention_data(reference_time timestamptz default now())
returns table (resource text, deleted_count bigint)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  return query
  with deleted_sessions as (
    delete from public.test_sessions
    where account_id is null
      and status in ('active', 'paused', 'expired', 'revoked')
      and expires_at <= reference_time
    returning 1
  )
  select 'guest_sessions'::text, count(*)::bigint from deleted_sessions;

  return query
  with deleted_limits as (
    delete from public.rate_limits
    where window_start < reference_time - interval '90 days'
    returning 1
  )
  select 'rate_limits'::text, count(*)::bigint from deleted_limits;

  perform set_config('lensadiri.retention_cleanup', 'on', true);

  return query
  with deleted_audits as (
    delete from public.audit_logs
    where created_at < reference_time - interval '365 days'
    returning 1
  )
  select 'audit_security_events'::text, count(*)::bigint from deleted_audits;
end;
$$;

revoke all on function public.preview_expired_retention_data(timestamptz) from public, anon, authenticated;
revoke all on function public.cleanup_expired_retention_data(timestamptz) from public, anon, authenticated;
revoke all on function public.prevent_audit_log_mutation() from public, anon, authenticated;

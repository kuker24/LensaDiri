-- Additive read-only dry-run companion for cleanup_expired_retention_data.
-- Counts rows that WOULD be deleted by the existing cleanup function without
-- deleting anything, so a scheduled job can verify eligibility and alert on
-- anomalies before or instead of mutating data. No existing function, policy,
-- grant, or data is changed. Account-owned results stay user_controlled and are
-- never counted here.

create function public.preview_expired_retention_data(reference_time timestamptz default now())
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
  where window_start < reference_time - interval '90 days';
$$;

revoke all on function public.preview_expired_retention_data(timestamptz) from public, anon, authenticated;

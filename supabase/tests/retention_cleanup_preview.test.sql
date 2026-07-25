begin;

select plan(14);

-- Function exists and is registered with the reference-time signature.
select ok(
  to_regprocedure('public.preview_expired_retention_data(timestamp with time zone)') is not null,
  'preview_expired_retention_data exists'
);

-- Browser roles cannot execute the dry-run function.
select ok(
  not has_function_privilege('anon', 'public.preview_expired_retention_data(timestamp with time zone)', 'EXECUTE'),
  'anon cannot execute retention preview'
);
select ok(
  not has_function_privilege('authenticated', 'public.preview_expired_retention_data(timestamp with time zone)', 'EXECUTE'),
  'authenticated cannot execute retention preview'
);

-- Seed one expired guest session and one recent account session as a control.
insert into public.accounts (id, email, email_normalized, password_hash)
values (
  '00000000-0000-0000-0000-0000000000a1',
  'retention-preview@example.com',
  'retention-preview@example.com',
  '$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0$0123456789abcdef0123456789abcdef'
);

-- Expired guest session (no account) that is eligible for cleanup.
insert into public.test_sessions (
  id, account_id, session_token_hash, mode, status, consent_version,
  module_version_id, started_at, expires_at
)
select
  '00000000-0000-0000-0000-0000000000b1', null,
  repeat('a', 64), 'quick', 'expired', 'test',
  module_versions.id, now() - interval '40 days', now() - interval '10 days'
from public.module_versions
inner join public.modules on modules.id = module_versions.module_id
where modules.key = 'trait_profile' and module_versions.version = 'mvp-1';

-- Active account-owned session that must be preserved.
insert into public.test_sessions (
  id, account_id, session_token_hash, mode, status, consent_version,
  module_version_id, started_at, expires_at
)
select
  '00000000-0000-0000-0000-0000000000b2',
  '00000000-0000-0000-0000-0000000000a1',
  repeat('b', 64), 'quick', 'active', 'test',
  module_versions.id, now() - interval '1 day', now() + interval '6 days'
from public.module_versions
inner join public.modules on modules.id = module_versions.module_id
where modules.key = 'trait_profile' and module_versions.version = 'mvp-1';

-- The dry-run counts the eligible guest session but not the account session.
select is(
  (
    select eligible_count
    from public.preview_expired_retention_data(now())
    where resource = 'guest_sessions'
  ),
  1::bigint,
  'preview counts one eligible expired guest session'
);

-- Reference time before expiry excludes the guest session (boundary safety).
select is(
  (
    select eligible_count
    from public.preview_expired_retention_data(now() - interval '20 days')
    where resource = 'guest_sessions'
  ),
  0::bigint,
  'preview excludes sessions not yet expired at the reference time'
);

-- Dry-run must not delete anything: both rows remain after two invocations.
do $$
begin
  perform public.preview_expired_retention_data(now());
  perform public.preview_expired_retention_data(now());
end;
$$;
select is(
  (select count(*)::integer from public.test_sessions where id in (
    '00000000-0000-0000-0000-0000000000b1',
    '00000000-0000-0000-0000-0000000000b2'
  )),
  2,
  'preview is read-only and deletes no rows'
);

-- The real cleanup then removes only the eligible guest session.
select is(
  (
    select deleted_count
    from public.cleanup_expired_retention_data(now())
    where resource = 'guest_sessions'
  ),
  1::bigint,
  'cleanup deletes exactly the one eligible guest session'
);
select ok(
  exists (select 1 from public.test_sessions where id = '00000000-0000-0000-0000-0000000000b2')
    and not exists (select 1 from public.test_sessions where id = '00000000-0000-0000-0000-0000000000b1'),
  'account session preserved and only expired guest session removed'
);

-- Cleanup is idempotent: a second run finds nothing to delete.
select is(
  (
    select deleted_count
    from public.cleanup_expired_retention_data(now())
    where resource = 'guest_sessions'
  ),
  0::bigint,
  'second cleanup run is a no-op for guest sessions'
);

-- Audit security events older than 365 days are eligible; recent ones are not.
insert into public.audit_logs (id, action, entity_type, entity_id, metadata_json, created_at)
values
  (
    '00000000-0000-0000-0000-0000000000c1',
    'account_login_failed', 'account', '00000000-0000-0000-0000-0000000000a1',
    '{}'::jsonb, now() - interval '400 days'
  ),
  (
    '00000000-0000-0000-0000-0000000000c2',
    'account_login_succeeded', 'account', '00000000-0000-0000-0000-0000000000a1',
    '{}'::jsonb, now() - interval '10 days'
  );

select is(
  (
    select eligible_count
    from public.preview_expired_retention_data(now())
    where resource = 'audit_security_events'
  ),
  1::bigint,
  'preview counts one audit event older than 365 days'
);

-- Direct delete outside the retention GUC remains rejected.
select throws_ok(
  $$delete from public.audit_logs where id = '00000000-0000-0000-0000-0000000000c1'$$,
  '55000',
  'audit logs are append-only',
  'direct audit delete remains append-only outside retention cleanup'
);

select is(
  (
    select deleted_count
    from public.cleanup_expired_retention_data(now())
    where resource = 'audit_security_events'
  ),
  1::bigint,
  'cleanup deletes the one audit event older than 365 days'
);

select ok(
  not exists (select 1 from public.audit_logs where id = '00000000-0000-0000-0000-0000000000c1')
    and exists (select 1 from public.audit_logs where id = '00000000-0000-0000-0000-0000000000c2'),
  'recent audit event preserved and only aged audit event removed'
);

select is(
  (
    select deleted_count
    from public.cleanup_expired_retention_data(now())
    where resource = 'audit_security_events'
  ),
  0::bigint,
  'second cleanup run is a no-op for audit security events'
);

select * from finish();
rollback;

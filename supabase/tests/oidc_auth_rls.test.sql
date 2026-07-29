begin;

select plan(15);

select ok(to_regclass('public.account_oidc_identities') is not null, 'OIDC identities table exists');
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.account_oidc_identities'::regclass),
  'OIDC identities has forced RLS'
);
select ok(
  not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'account_oidc_identities'),
  'OIDC identities has no browser policy'
);
select ok(not has_table_privilege('anon', 'public.account_oidc_identities', 'SELECT'), 'anon cannot select OIDC identities');
select ok(not has_table_privilege('anon', 'public.account_oidc_identities', 'INSERT'), 'anon cannot insert OIDC identities');
select ok(not has_table_privilege('anon', 'public.account_oidc_identities', 'UPDATE'), 'anon cannot update OIDC identities');
select ok(not has_table_privilege('anon', 'public.account_oidc_identities', 'DELETE'), 'anon cannot delete OIDC identities');
select ok(not has_table_privilege('authenticated', 'public.account_oidc_identities', 'SELECT'), 'authenticated cannot select OIDC identities');
select ok(not has_table_privilege('authenticated', 'public.account_oidc_identities', 'INSERT'), 'authenticated cannot insert OIDC identities');
select ok(
  exists (select 1 from pg_constraint where conname = 'account_oidc_identities_provider_subject_key'),
  'provider subject identity is unique'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'account_oidc_identities_account_provider_key'),
  'account provider identity is unique'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_oidc_identities'::regclass
      and conname = 'account_oidc_identities_account_id_fkey'
      and confdeltype = 'c'
  ),
  'OIDC identities cascade on account hard delete'
);
select ok(
  exists (select 1 from pg_constraint where conname = 'rate_limits_route_key'),
  'OIDC rate-limit routes remain constrained'
);
select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'account_sessions'
      and column_name = 'authenticated_with' and is_nullable = 'NO'
  ),
  'sessions record authentication method'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.account_sessions'::regclass
      and pg_get_constraintdef(oid) like '%authenticated_with%'
  ),
  'session authentication method is constrained'
);

select * from finish();
rollback;

begin;

select plan(18);

select ok(to_regclass('public.consent_policy_versions') is not null, 'consent policy versions exist');
select ok(to_regclass('public.retention_policies') is not null, 'retention policies exist');
select ok(to_regclass('public.content_publication_events') is not null, 'publication ledger exists');

select ok(
  not exists (
    select 1 from pg_class
    where oid = any(array[
      'public.consent_policy_versions'::regclass,
      'public.retention_policies'::regclass,
      'public.content_publication_events'::regclass
    ]) and not (relrowsecurity and relforcerowsecurity)
  ),
  'new privacy and publication tables force RLS'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('consent_policy_versions', 'retention_policies', 'content_publication_events')
  ),
  'new privacy and publication tables have zero browser policies'
);

select ok(not has_table_privilege('anon', 'public.consent_policy_versions', 'SELECT'), 'anon cannot select consent policy versions');
select ok(not has_table_privilege('authenticated', 'public.retention_policies', 'SELECT'), 'browser user cannot select retention policies');
select ok(not has_table_privilege('authenticated', 'public.content_publication_events', 'SELECT'), 'browser user cannot select publication ledger');

select is(
  (select count(*)::integer from public.modules where release_disposition = 'DEFERRED_WITH_REASON'),
  6,
  'six modules are explicitly deferred'
);
select is(
  (select count(*)::integer from public.modules where release_disposition = 'DEFERRED_WITH_REASON' and is_selectable),
  0,
  'deferred modules are not selectable'
);
select is(
  (select count(*)::integer from public.modules where release_disposition = 'RELEASE_READY' and is_selectable),
  4,
  'four independently scored modules are release-ready and selectable'
);
select is(
  (select count(*)::integer from public.combo_presets where status = 'published'),
  3,
  'three curated presets are published'
);
select is(
  (
    select count(*)::integer
    from public.combo_preset_modules
    join public.combo_presets on combo_presets.id = combo_preset_modules.combo_preset_id
    where combo_presets.key = 'full_spectrum' and combo_preset_modules.required
  ),
  4,
  'Full Spectrum contains every currently release-ready module'
);
select is(
  (select max_items_per_segment::integer from public.assessment_mode_profiles where mode = 'deep'),
  60,
  'Complex is split into 60-item segments'
);
select is(
  (select count(*)::integer from public.feature_flags where enabled),
  0,
  'all seeded feature flags remain off'
);
select is(
  (select count(*)::integer from public.consent_policy_versions where status = 'published'),
  5,
  'five consent taxonomy policies are published'
);
select is(
  (select count(*)::integer from public.retention_policies where status = 'published'),
  4,
  'four retention policies are published'
);
select ok(
  to_regprocedure('public.publish_module_version(uuid,uuid,text)') is not null
    and to_regprocedure('public.publish_combo_preset(uuid,uuid,text)') is not null
    and to_regprocedure('public.set_feature_flag_state(text,boolean,boolean,uuid,text)') is not null
    and to_regprocedure('public.cleanup_expired_retention_data(timestamp with time zone)') is not null,
  'trusted publication and cleanup functions exist'
);

select * from finish();
rollback;

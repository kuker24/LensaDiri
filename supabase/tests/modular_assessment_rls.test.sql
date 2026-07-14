begin;

select plan(61);

select ok(to_regclass('public.question_translations') is not null, 'question_translations exists');
select ok(to_regclass('public.question_options') is not null, 'question_options exists');
select ok(to_regclass('public.question_dimension_mappings') is not null, 'question mappings exist');
select ok(to_regclass('public.combo_presets') is not null, 'combo_presets exists');
select ok(to_regclass('public.combo_preset_modules') is not null, 'combo_preset_modules exists');
select ok(to_regclass('public.assessment_mode_profiles') is not null, 'mode profiles exists');
select ok(to_regclass('public.assessment_blueprints') is not null, 'blueprints exists');
select ok(to_regclass('public.assessment_blueprint_items') is not null, 'blueprint items exists');
select ok(to_regclass('public.test_session_modules') is not null, 'session modules exists');
select ok(to_regclass('public.test_session_segments') is not null, 'session segments exists');
select ok(to_regclass('public.result_modules') is not null, 'result modules exists');
select ok(to_regclass('public.result_module_scores') is not null, 'module scores exists');
select ok(to_regclass('public.result_correlations') is not null, 'correlations exists');
select ok(to_regclass('public.result_correlation_sources') is not null, 'correlation sources exists');
select ok(to_regclass('public.result_clarifiers') is not null, 'clarifiers exists');
select ok(to_regclass('public.result_clarifier_items') is not null, 'clarifier items exists');
select ok(to_regclass('public.result_clarifier_answers') is not null, 'clarifier answers exists');
select ok(to_regclass('public.result_versions') is not null, 'result versions exists');
select ok(to_regclass('public.feature_flags') is not null, 'feature flags exists');

select ok(
  not exists (
    select 1
    from pg_class
    where oid = any(array[
      'public.question_translations'::regclass,
      'public.question_options'::regclass,
      'public.question_dimension_mappings'::regclass,
      'public.combo_presets'::regclass,
      'public.combo_preset_modules'::regclass,
      'public.assessment_mode_profiles'::regclass,
      'public.assessment_blueprints'::regclass,
      'public.assessment_blueprint_items'::regclass,
      'public.test_session_modules'::regclass,
      'public.test_session_segments'::regclass,
      'public.result_modules'::regclass,
      'public.result_module_scores'::regclass,
      'public.result_correlations'::regclass,
      'public.result_correlation_sources'::regclass,
      'public.result_clarifiers'::regclass,
      'public.result_clarifier_items'::regclass,
      'public.result_clarifier_answers'::regclass,
      'public.result_versions'::regclass,
      'public.feature_flags'::regclass
    ]) and not (relrowsecurity and relforcerowsecurity)
  ),
  'all modular tables force RLS'
);

select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in (
        'question_translations', 'question_options', 'question_dimension_mappings',
        'combo_presets', 'combo_preset_modules', 'assessment_mode_profiles',
        'assessment_blueprints', 'assessment_blueprint_items', 'test_session_modules',
        'test_session_segments', 'result_modules', 'result_module_scores',
        'result_correlations', 'result_correlation_sources', 'result_clarifiers',
        'result_clarifier_items', 'result_clarifier_answers', 'result_versions', 'feature_flags'
      )
  ),
  'modular tables have zero browser policies'
);

select ok(not has_table_privilege('anon', 'public.combo_presets', 'SELECT'), 'anon cannot select presets');
select ok(not has_table_privilege('anon', 'public.assessment_blueprints', 'SELECT'), 'anon cannot select blueprints');
select ok(not has_table_privilege('anon', 'public.assessment_blueprint_items', 'SELECT'), 'anon cannot select blueprint items');
select ok(not has_table_privilege('anon', 'public.test_session_segments', 'SELECT'), 'anon cannot select segments');
select ok(not has_table_privilege('anon', 'public.result_modules', 'SELECT'), 'anon cannot select module results');
select ok(not has_table_privilege('anon', 'public.result_correlations', 'SELECT'), 'anon cannot select correlations');
select ok(not has_table_privilege('authenticated', 'public.combo_presets', 'SELECT'), 'browser user cannot select presets');
select ok(not has_table_privilege('authenticated', 'public.assessment_blueprints', 'SELECT'), 'browser user cannot select blueprints');
select ok(not has_table_privilege('authenticated', 'public.assessment_blueprint_items', 'SELECT'), 'browser user cannot select blueprint items');
select ok(not has_table_privilege('authenticated', 'public.test_session_segments', 'SELECT'), 'browser user cannot select segments');
select ok(not has_table_privilege('authenticated', 'public.result_modules', 'SELECT'), 'browser user cannot select module results');
select ok(not has_table_privilege('authenticated', 'public.result_correlations', 'SELECT'), 'browser user cannot select correlations');
select ok(not has_table_privilege('anon', 'public.result_clarifier_items', 'SELECT'), 'anon cannot select clarifier items');
select ok(not has_table_privilege('anon', 'public.result_clarifier_answers', 'SELECT'), 'anon cannot select clarifier answers');
select ok(not has_table_privilege('authenticated', 'public.result_clarifier_items', 'SELECT'), 'browser user cannot select clarifier items');
select ok(not has_table_privilege('authenticated', 'public.result_clarifier_answers', 'SELECT'), 'browser user cannot select clarifier answers');

select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'assessment_blueprints_hash_hex'
  ),
  'blueprint hash constrained'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'assessment_blueprint_items_question_unique'
  ),
  'blueprint question membership unique'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'test_session_segments_item_range'
  ),
  'segment size capped at 120'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'result_modules_confidence_range'
  ),
  'module confidence constrained'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conname = 'result_clarifiers_item_range'
  ),
  'clarifier item count constrained'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.test_session_modules'::regclass
      and conname = 'test_session_modules_session_id_fkey'
      and confdeltype = 'c'
  ),
  'session deletion cascades module progress'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.result_modules'::regclass
      and conname = 'result_modules_result_id_fkey'
      and confdeltype = 'c'
  ),
  'result deletion cascades module results'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.result_clarifier_items'::regclass
      and conname = 'result_clarifier_items_clarifier_id_fkey'
      and confdeltype = 'c'
  ),
  'clarifier deletion cascades supplemental items'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.result_clarifier_answers'::regclass
      and conname = 'result_clarifier_answers_clarifier_item_id_fkey'
      and confdeltype = 'c'
  ),
  'clarifier item deletion cascades supplemental answers'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.assessment_blueprint_items'::regclass
      and conname = 'assessment_blueprint_items_question_id_fkey'
      and confdeltype = 'r'
  ),
  'used blueprint questions are delete-restricted'
);

select ok('deep' = any(enum_range(null::public.assessment_mode)::text[]), 'deep mode exists');
select ok('published' = any(enum_range(null::public.module_status)::text[]), 'published status exists');
select ok('full_spectrum' = any(enum_range(null::public.selection_type)::text[]), 'full-spectrum selection exists');
select ok('clarifier_required' = any(enum_range(null::public.assessment_status)::text[]), 'clarifier status exists');

select is(
  (
    select count(*)::integer
    from public.questions
    inner join public.module_versions on module_versions.id = questions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
  ),
  60,
  'legacy seed keeps 60 Trait Profile questions'
);
select is(
  (
    select count(*)::integer
    from public.questions
    inner join public.module_versions on module_versions.id = questions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    where modules.key = 'trait_profile'
      and module_versions.version = 'mvp-1'
      and questions.quick_enabled
  ),
  40,
  'legacy seed keeps 40 Quick Trait Profile questions'
);
select is(
  (
    select count(*)::integer
    from public.question_translations
    inner join public.questions on questions.id = question_translations.question_id
    inner join public.module_versions on module_versions.id = questions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    where modules.key = 'trait_profile'
      and module_versions.version = 'mvp-1'
      and question_translations.locale = 'id'
  ),
  60,
  'legacy questions have Indonesian translations'
);
select is(
  (
    select count(*)::integer
    from public.question_dimension_mappings
    inner join public.questions on questions.id = question_dimension_mappings.question_id
    inner join public.module_versions on module_versions.id = questions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
  ),
  60,
  'legacy questions have explicit primary mappings'
);

insert into public.modules (
  key, public_name, internal_name, description, evidence_tier, status, category,
  is_selectable, minimum_age, default_order, description_key
)
values (
  'immutability_test', 'Immutability Test', 'Immutability Test',
  'Transaction-local pgTAP fixture.', 'B', 'draft', 'typology', false, 13, 9999,
  'module.immutability_test.description'
);

insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, report_template_version, published_at
)
select
  id, '1', 'test', 'test-1', 'test-1', 'published', 'test-1', now()
from public.modules where key = 'immutability_test';

select throws_ok(
  $$update public.module_versions
    set scoring_version = 'mutated'
    where version = '1'
      and module_id = (select id from public.modules where key = 'immutability_test')$$,
  '55000',
  'published module versions are immutable',
  'published module version update is blocked'
);

select throws_ok(
  $$insert into public.question_dimensions (
      module_version_id, construct_key, facet_key, label, description
    )
    select id, 'blocked', 'general', 'Blocked', 'Blocked insert'
    from public.module_versions
    where version = '1'
      and module_id = (select id from public.modules where key = 'immutability_test')$$,
  '55000',
  'published module content is immutable',
  'published module content insert is blocked'
);

insert into public.assessment_blueprints (
  composer_version, content_version, mode, selection_type, locale,
  selected_modules_json, segment_plan_json, item_count, estimated_minutes,
  segment_count, blueprint_hash, seed_hash
)
values (
  'test-1', 'test-1', 'quick', 'single', 'id', '["trait_profile"]'::jsonb,
  '[{"segmentIndex":1,"itemCount":1}]'::jsonb, 1, 1, 1,
  repeat('a', 64), repeat('b', 64)
);

insert into public.test_sessions (
  session_token_hash, mode, consent_version, module_version_id, blueprint_id, expires_at
)
select
  repeat('c', 64), 'quick', 'test', module_versions.id, assessment_blueprints.id,
  now() + interval '1 hour'
from public.module_versions
inner join public.modules on modules.id = module_versions.module_id
cross join public.assessment_blueprints
where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
  and assessment_blueprints.blueprint_hash = repeat('a', 64);

select throws_ok(
  $$update public.assessment_blueprints
    set estimated_minutes = 2
    where blueprint_hash = repeat('a', 64)$$,
  '55000',
  'used assessment blueprints are immutable',
  'blueprint update is blocked after session start'
);

select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.module_versions'::regclass
      and tgname = 'module_versions_immutable'
      and not tgisinternal
  ),
  'module version immutability trigger installed'
);
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.assessment_blueprints'::regclass
      and tgname = 'assessment_blueprints_immutable'
      and not tgisinternal
  ),
  'blueprint immutability trigger installed'
);
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.assessment_blueprint_items'::regclass
      and tgname = 'assessment_blueprint_items_immutable'
      and not tgisinternal
  ),
  'blueprint item immutability trigger installed'
);

select * from finish();
rollback;

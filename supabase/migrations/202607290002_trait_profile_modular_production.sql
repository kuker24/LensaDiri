-- Repair incomplete independent Trait Profile content in migration-only production.
-- Published modular-1 and legacy mvp-1 remain immutable; repair uses modular-2.

do $$
declare
  source_dimension_count integer;
  source_mapping_count integer;
  source_question_count integer;
  source_translation_count integer;
begin
  if not exists (select 1 from public.modules where key = 'trait_profile') then
    return;
  end if;

  select count(*)::integer into source_dimension_count
  from public.question_dimensions
  inner join public.module_versions on module_versions.id = question_dimensions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1';

  select count(*)::integer into source_question_count
  from public.questions
  inner join public.module_versions on module_versions.id = questions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1';

  select count(*)::integer into source_translation_count
  from public.question_translations
  inner join public.questions on questions.id = question_translations.question_id
  inner join public.module_versions on module_versions.id = questions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1';

  select count(*)::integer into source_mapping_count
  from public.question_dimension_mappings
  inner join public.questions on questions.id = question_dimension_mappings.question_id
  inner join public.module_versions on module_versions.id = questions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1';

  if source_dimension_count <> 5 or source_question_count <> 60
    or source_translation_count <> 60 or source_mapping_count <> 60
  then
    raise exception 'Trait Profile modular publication requires canonical legacy content'
      using errcode = '55000';
  end if;
end;
$$;

insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select
  modules.id,
  'modular-2',
  'trait_profile_modular_likert_v1',
  'trait-profile-modular-1',
  'trait-profile-modular-2',
  'draft',
  '{"scaleMin":1,"scaleMax":5,"dimensions":5}'::jsonb,
  '{"quickQuota":40,"standardQuota":60,"deepQuota":60}'::jsonb,
  'trait-profile-modular-report-1',
  null
from public.modules
where modules.key = 'trait_profile'
  and exists (
    select 1 from public.module_versions
    where module_versions.module_id = modules.id and module_versions.version = 'modular-1'
  )
  and not exists (
    select 1 from public.module_versions
    where module_versions.module_id = modules.id and module_versions.version = 'modular-2'
  );

with source_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
), target_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'modular-2'
), source_dimensions as (
  select construct_key, facet_key, label, description, minimum_item_coverage
  from public.question_dimensions
  inner join source_version on source_version.id = question_dimensions.module_version_id
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select
  target_version.id, source_dimensions.construct_key, source_dimensions.facet_key,
  source_dimensions.label, source_dimensions.description, source_dimensions.minimum_item_coverage
from source_dimensions
cross join target_version
where not exists (
  select 1 from public.question_dimensions as existing
  where existing.module_version_id = target_version.id
    and existing.construct_key = source_dimensions.construct_key
    and existing.facet_key = source_dimensions.facet_key
);

with source_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
), target_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'modular-2'
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  response_scale, polarity, weight, quick_enabled, mode_eligibility,
  information_priority, clarifier_enabled, exposure_group, sensitivity_level,
  review_status, display_order, status
)
select
  target_version.id,
  target_dimensions.id,
  source_questions.item_code,
  source_questions.public_text,
  source_questions.internal_construct_note,
  source_questions.response_scale,
  source_questions.polarity,
  source_questions.weight,
  source_questions.quick_enabled,
  case
    when source_questions.quick_enabled then array['quick', 'standard', 'deep']::text[]
    else array['standard', 'deep']::text[]
  end,
  source_questions.information_priority,
  source_questions.clarifier_enabled,
  source_questions.exposure_group,
  source_questions.sensitivity_level,
  source_questions.review_status,
  source_questions.display_order,
  source_questions.status
from public.questions as source_questions
inner join source_version on source_version.id = source_questions.module_version_id
inner join public.question_dimensions as source_dimensions
  on source_dimensions.id = source_questions.dimension_id
cross join target_version
inner join public.question_dimensions as target_dimensions
  on target_dimensions.module_version_id = target_version.id
  and target_dimensions.construct_key = source_dimensions.construct_key
  and target_dimensions.facet_key = source_dimensions.facet_key
where not exists (
  select 1 from public.questions as existing
  where existing.module_version_id = target_version.id
    and existing.item_code = source_questions.item_code
);

with source_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
), target_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'modular-2'
)
insert into public.question_translations (
  question_id, locale, public_text, helper_text, reading_level, review_status
)
select
  target_questions.id, source_translations.locale, source_translations.public_text,
  source_translations.helper_text, source_translations.reading_level,
  source_translations.review_status
from public.question_translations as source_translations
inner join public.questions as source_questions
  on source_questions.id = source_translations.question_id
inner join source_version on source_version.id = source_questions.module_version_id
cross join target_version
inner join public.questions as target_questions
  on target_questions.module_version_id = target_version.id
  and target_questions.item_code = source_questions.item_code
where not exists (
  select 1 from public.question_translations as existing
  where existing.question_id = target_questions.id
    and existing.locale = source_translations.locale
);

with source_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
), target_version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'modular-2'
)
insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select
  target_questions.id, target_dimensions.id, source_mappings.scoring_role,
  source_mappings.polarity, source_mappings.weight, source_mappings.consistency_pair_key
from public.question_dimension_mappings as source_mappings
inner join public.questions as source_questions on source_questions.id = source_mappings.question_id
inner join source_version on source_version.id = source_questions.module_version_id
inner join public.question_dimensions as source_dimensions
  on source_dimensions.id = source_mappings.dimension_id
cross join target_version
inner join public.questions as target_questions
  on target_questions.module_version_id = target_version.id
  and target_questions.item_code = source_questions.item_code
inner join public.question_dimensions as target_dimensions
  on target_dimensions.module_version_id = target_version.id
  and target_dimensions.construct_key = source_dimensions.construct_key
  and target_dimensions.facet_key = source_dimensions.facet_key
where not exists (
  select 1 from public.question_dimension_mappings as existing
  where existing.question_id = target_questions.id
    and existing.dimension_id = target_dimensions.id
);

update public.module_versions
set status = 'published', published_at = now()
where version = 'modular-2'
  and status = 'draft'
  and module_id = (select id from public.modules where key = 'trait_profile');

update public.combo_preset_modules
set module_version_id = repair_version.id
from public.module_versions as repair_version
inner join public.modules on modules.id = repair_version.module_id
where modules.key = 'trait_profile'
  and repair_version.version = 'modular-2'
  and combo_preset_modules.module_id = modules.id;

do $$
declare
  active_item_bank_version text;
  deep_question_count integer;
  mapping_count integer;
  question_count integer;
  quick_question_count integer;
  scoring_version text;
  translation_count integer;
begin
  if not exists (select 1 from public.modules where key = 'trait_profile') then
    return;
  end if;
  if not exists (
    select 1
    from public.module_versions
    inner join public.modules on modules.id = module_versions.module_id
    where modules.key = 'trait_profile' and module_versions.version = 'modular-1'
  ) then
    return;
  end if;

  select
    count(*)::integer,
    count(*) filter (where questions.quick_enabled)::integer,
    count(*) filter (where 'deep' = any(questions.mode_eligibility))::integer,
    min(module_versions.scoring_version),
    min(module_versions.item_bank_version)
  into question_count, quick_question_count, deep_question_count, scoring_version,
    active_item_bank_version
  from public.questions
  inner join public.module_versions on module_versions.id = questions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile'
    and module_versions.version = case when exists (
      select 1 from public.module_versions as repair_version
      where repair_version.module_id = modules.id and repair_version.version = 'modular-2'
    ) then 'modular-2' else 'modular-1' end;

  select count(*)::integer into translation_count
  from public.question_translations
  inner join public.questions on questions.id = question_translations.question_id
  inner join public.module_versions on module_versions.id = questions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile'
    and module_versions.version = case when exists (
      select 1 from public.module_versions as repair_version
      where repair_version.module_id = modules.id and repair_version.version = 'modular-2'
    ) then 'modular-2' else 'modular-1' end;

  select count(*)::integer into mapping_count
  from public.question_dimension_mappings
  inner join public.questions on questions.id = question_dimension_mappings.question_id
  inner join public.module_versions on module_versions.id = questions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile'
    and module_versions.version = case when exists (
      select 1 from public.module_versions as repair_version
      where repair_version.module_id = modules.id and repair_version.version = 'modular-2'
    ) then 'modular-2' else 'modular-1' end;

  if question_count <> 60 or quick_question_count <> 40 or deep_question_count <> 60
    or translation_count <> 60 or mapping_count <> 60
    or scoring_version <> 'trait-profile-modular-1'
    or active_item_bank_version not in ('trait-profile-modular-1', 'trait-profile-modular-2')
  then
    raise exception 'Trait Profile modular publication postcheck failed' using errcode = '55000';
  end if;
end;
$$;

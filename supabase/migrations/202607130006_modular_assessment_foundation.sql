-- PRD v2 modular assessment foundation.
-- Additive only: existing Quick 40 / Standard 60 sessions and results remain valid.
-- Trusted Next.js server remains the sole data boundary.

create type public.module_category as enum (
  'trait', 'typology', 'motivation', 'communication', 'career', 'relationship',
  'experimental', 'cultural'
);
create type public.selection_type as enum (
  'single', 'custom_combo', 'preset_combo', 'full_spectrum', 'legacy'
);
create type public.review_status as enum (
  'draft', 'language_review', 'construct_review', 'bias_review', 'pilot',
  'approved', 'rejected'
);
create type public.blueprint_status as enum ('draft', 'locked', 'retired');
create type public.session_module_status as enum ('pending', 'active', 'completed', 'skipped');
create type public.session_segment_status as enum ('pending', 'active', 'paused', 'completed');
create type public.clarifier_status as enum (
  'recommended', 'required', 'in_progress', 'completed', 'skipped'
);
create type public.correlation_kind as enum (
  'reinforcing', 'complementary', 'reflective_tension', 'context_dependent',
  'low_confidence_conflict'
);

alter table public.rate_limits
  drop constraint rate_limits_route_key;

alter table public.rate_limits
  add constraint rate_limits_route_key check (
    route_key in (
      'auth_register', 'auth_login', 'auth_session', 'auth_logout', 'account_delete',
      'assessment_estimate', 'assessment_start', 'assessment_answer',
      'assessment_pause', 'assessment_resume', 'assessment_complete',
      'assessment_clarifier', 'result_share', 'result_export', 'result_delete',
      'result_feedback'
    )
  );

alter table public.audit_logs
  drop constraint audit_logs_action_not_blank;

alter table public.audit_logs
  add constraint audit_logs_action_not_blank check (
    action in (
      'account_registered', 'account_login_succeeded', 'account_login_failed',
      'account_logout', 'account_session_revoked', 'consent_recorded',
      'consent_revoked', 'assessment_started', 'assessment_paused',
      'assessment_resumed', 'assessment_completed', 'clarifier_started',
      'clarifier_completed', 'result_shared', 'result_share_revoked',
      'result_exported', 'result_deleted', 'admin_accessed',
      'admin_content_changed', 'module_version_published', 'combo_preset_published'
    )
  );

alter table public.audit_logs
  drop constraint audit_logs_entity_type_not_blank;

alter table public.audit_logs
  add constraint audit_logs_entity_type_not_blank check (
    entity_type in (
      'account', 'account_session', 'consent', 'assessment_session',
      'assessment_blueprint', 'result', 'result_share', 'module_version',
      'combo_preset', 'admin_resource', 'system'
    )
  );

alter table public.modules
  add column internal_name text,
  add column category public.module_category,
  add column is_selectable boolean not null default false,
  add column is_experimental boolean not null default false,
  add column minimum_age smallint not null default 13,
  add column default_order integer not null default 1000,
  add column description_key text,
  add column updated_at timestamptz not null default now();

update public.modules
set
  internal_name = coalesce(internal_name, public_name),
  category = coalesce(category, 'trait'::public.module_category),
  description_key = coalesce(description_key, 'module.' || key || '.description'),
  is_selectable = case when key = 'trait_profile' then true else is_selectable end,
  default_order = case when key = 'trait_profile' then 10 else default_order end;

alter table public.modules
  alter column internal_name set not null,
  alter column category set not null,
  alter column description_key set not null,
  add constraint modules_internal_name_not_blank check (length(btrim(internal_name)) > 0),
  add constraint modules_description_key_format check (
    description_key ~ '^[a-z][a-z0-9_.-]{2,100}$'
  ),
  add constraint modules_minimum_age_range check (minimum_age between 13 and 99),
  add constraint modules_default_order_positive check (default_order > 0),
  add constraint modules_experimental_consistent check (
    not is_experimental or evidence_tier in ('B_EXPERIMENTAL', 'EXPERIMENTAL', 'C')
  );

create unique index modules_default_order_key on public.modules (default_order);
create index modules_catalog_idx
  on public.modules (status, is_selectable, default_order)
  where is_selectable;

create trigger modules_set_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

alter table public.module_versions
  add column scoring_version text,
  add column item_bank_version text,
  add column composer_config_json jsonb not null default '{}'::jsonb,
  add column report_template_version text,
  add column updated_at timestamptz not null default now();

update public.module_versions
set
  scoring_version = coalesce(scoring_version, scoring_strategy),
  item_bank_version = coalesce(item_bank_version, version),
  report_template_version = coalesce(report_template_version, 'legacy-mvp-1');

alter table public.module_versions
  alter column scoring_version set not null,
  alter column item_bank_version set not null,
  alter column report_template_version set not null,
  add constraint module_versions_scoring_version_not_blank check (
    length(btrim(scoring_version)) > 0
  ),
  add constraint module_versions_item_bank_version_not_blank check (
    length(btrim(item_bank_version)) > 0
  ),
  add constraint module_versions_report_version_not_blank check (
    length(btrim(report_template_version)) > 0
  ),
  add constraint module_versions_composer_config_object check (
    jsonb_typeof(composer_config_json) = 'object'
  ),
  add constraint module_versions_publication_consistent check (
    status not in ('published', 'retired') or published_at is not null
  );

create index module_versions_catalog_idx
  on public.module_versions (module_id, status, published_at desc nulls last);

create trigger module_versions_set_updated_at
before update on public.module_versions
for each row execute function public.set_updated_at();

create function public.prevent_published_module_version_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if old.status in ('published', 'retired') then
    raise exception 'published module versions are immutable' using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger module_versions_immutable
before update or delete on public.module_versions
for each row execute function public.prevent_published_module_version_mutation();

alter table public.question_dimensions
  drop constraint question_dimensions_unique,
  add column facet_key text not null default 'general',
  add column minimum_item_coverage smallint not null default 1,
  add column updated_at timestamptz not null default now(),
  add constraint question_dimensions_unique unique (module_version_id, construct_key, facet_key),
  add constraint question_dimensions_facet_key_format check (
    facet_key ~ '^[a-z][a-z0-9_]{0,39}$'
  ),
  add constraint question_dimensions_coverage_positive check (
    minimum_item_coverage between 1 and 120
  );

create trigger question_dimensions_set_updated_at
before update on public.question_dimensions
for each row execute function public.set_updated_at();

alter table public.questions
  add column internal_construct_note text,
  add column response_scale text not null default 'likert_5',
  add column mode_eligibility text[] not null default array['quick', 'standard']::text[],
  add column information_priority numeric(5,4) not null default 0.5,
  add column clarifier_enabled boolean not null default false,
  add column exposure_group text,
  add column sensitivity_level smallint not null default 0,
  add column review_status public.review_status not null default 'draft',
  add constraint questions_response_scale check (response_scale in ('likert_5', 'single_choice')),
  add constraint questions_mode_eligibility check (
    cardinality(mode_eligibility) > 0
    and mode_eligibility <@ array['quick', 'standard', 'deep']::text[]
  ),
  add constraint questions_information_priority_range check (
    information_priority between 0 and 1
  ),
  add constraint questions_sensitivity_level_range check (
    sensitivity_level between 0 and 3
  ),
  add constraint questions_exposure_group_format check (
    exposure_group is null or exposure_group ~ '^[a-z][a-z0-9_-]{1,49}$'
  );

update public.questions
set
  mode_eligibility = case
    when quick_enabled then array['quick', 'standard']::text[]
    else array['standard']::text[]
  end,
  internal_construct_note = coalesce(internal_construct_note, item_code),
  review_status = 'approved';

alter table public.questions
  alter column internal_construct_note set not null;

create table public.question_translations (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  locale text not null,
  public_text text not null,
  helper_text text,
  reading_level text,
  review_status public.review_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint question_translations_unique unique (question_id, locale),
  constraint question_translations_locale check (locale in ('id', 'en')),
  constraint question_translations_text_not_blank check (length(btrim(public_text)) > 0),
  constraint question_translations_helper_length check (
    helper_text is null or length(helper_text) <= 500
  )
);

create trigger question_translations_set_updated_at
before update on public.question_translations
for each row execute function public.set_updated_at();

insert into public.question_translations (
  question_id, locale, public_text, review_status
)
select id, 'id', public_text, 'approved'
from public.questions
on conflict (question_id, locale) do nothing;

create table public.question_options (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_value text not null,
  public_label text not null,
  display_order smallint not null,
  score_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint question_options_value_unique unique (question_id, option_value),
  constraint question_options_order_unique unique (question_id, display_order),
  constraint question_options_value_not_blank check (length(btrim(option_value)) > 0),
  constraint question_options_label_not_blank check (length(btrim(public_label)) > 0),
  constraint question_options_order_positive check (display_order > 0),
  constraint question_options_score_object check (jsonb_typeof(score_json) = 'object')
);

create table public.question_dimension_mappings (
  id uuid primary key default extensions.gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  dimension_id uuid not null references public.question_dimensions(id) on delete restrict,
  scoring_role text not null default 'primary',
  polarity smallint not null,
  weight numeric(6,3) not null default 1,
  consistency_pair_key text,
  created_at timestamptz not null default now(),
  constraint question_dimension_mappings_unique unique (question_id, dimension_id),
  constraint question_dimension_mappings_role check (
    scoring_role in ('primary', 'secondary', 'quality', 'clarifier')
  ),
  constraint question_dimension_mappings_polarity check (polarity in (-1, 1)),
  constraint question_dimension_mappings_weight_positive check (weight > 0),
  constraint question_dimension_mappings_pair_format check (
    consistency_pair_key is null
    or consistency_pair_key ~ '^[a-zA-Z0-9_-]{2,50}$'
  )
);

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight
)
select id, dimension_id, 'primary', polarity, weight
from public.questions
on conflict (question_id, dimension_id) do nothing;

create function public.prevent_published_module_content_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  target_version_id uuid;
  target_question_id uuid;
begin
  if tg_table_name in ('questions', 'question_dimensions') then
    if tg_op = 'DELETE' then
      target_version_id := old.module_version_id;
    elsif tg_op = 'UPDATE' then
      if exists (
        select 1 from public.module_versions
        where id = old.module_version_id and status in ('published', 'retired')
      ) then
        raise exception 'published module content is immutable' using errcode = '55000';
      end if;
      target_version_id := new.module_version_id;
    else
      target_version_id := new.module_version_id;
    end if;
  elsif tg_table_name in ('question_translations', 'question_options') then
    if tg_op = 'DELETE' then
      target_question_id := old.question_id;
    elsif tg_op = 'UPDATE' then
      if exists (
        select 1 from public.questions
        inner join public.module_versions on module_versions.id = questions.module_version_id
        where questions.id = old.question_id
          and module_versions.status in ('published', 'retired')
      ) then
        raise exception 'published module content is immutable' using errcode = '55000';
      end if;
      target_question_id := new.question_id;
    else
      target_question_id := new.question_id;
    end if;
    select module_version_id into target_version_id
    from public.questions where id = target_question_id;
  elsif tg_table_name = 'question_dimension_mappings' then
    if tg_op = 'DELETE' then
      target_question_id := old.question_id;
    elsif tg_op = 'UPDATE' then
      if exists (
        select 1 from public.questions
        inner join public.module_versions on module_versions.id = questions.module_version_id
        where questions.id = old.question_id
          and module_versions.status in ('published', 'retired')
      ) then
        raise exception 'published module content is immutable' using errcode = '55000';
      end if;
      target_question_id := new.question_id;
    else
      target_question_id := new.question_id;
    end if;
    select module_version_id into target_version_id
    from public.questions where id = target_question_id;
  end if;

  if exists (
    select 1 from public.module_versions
    where id = target_version_id and status in ('published', 'retired')
  ) then
    raise exception 'published module content is immutable' using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger question_dimensions_immutable
before insert or update or delete on public.question_dimensions
for each row execute function public.prevent_published_module_content_mutation();
create trigger questions_immutable
before insert or update or delete on public.questions
for each row execute function public.prevent_published_module_content_mutation();
create trigger question_translations_immutable
before insert or update or delete on public.question_translations
for each row execute function public.prevent_published_module_content_mutation();
create trigger question_options_immutable
before insert or update or delete on public.question_options
for each row execute function public.prevent_published_module_content_mutation();
create trigger question_dimension_mappings_immutable
before insert or update or delete on public.question_dimension_mappings
for each row execute function public.prevent_published_module_content_mutation();

create table public.combo_presets (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique,
  public_name text not null,
  description text not null,
  status public.module_status not null default 'draft',
  recommended_mode public.assessment_mode not null default 'standard',
  is_full_spectrum boolean not null default false,
  default_order integer not null,
  compatibility_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint combo_presets_key_format check (key ~ '^[a-z][a-z0-9_]{1,49}$'),
  constraint combo_presets_text_not_blank check (
    length(btrim(public_name)) > 0 and length(btrim(description)) > 0
  ),
  constraint combo_presets_order_positive check (default_order > 0),
  constraint combo_presets_compatibility_object check (
    jsonb_typeof(compatibility_json) = 'object'
  ),
  constraint combo_presets_publication_consistent check (
    status not in ('published', 'retired') or published_at is not null
  )
);

create unique index combo_presets_default_order_key on public.combo_presets (default_order);
create index combo_presets_catalog_idx
  on public.combo_presets (status, default_order)
  where status in ('active', 'pilot', 'published', 'experimental');

create trigger combo_presets_set_updated_at
before update on public.combo_presets
for each row execute function public.set_updated_at();

create table public.combo_preset_modules (
  combo_preset_id uuid not null references public.combo_presets(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete restrict,
  module_version_id uuid references public.module_versions(id) on delete restrict,
  display_order smallint not null,
  required boolean not null default true,
  dependency_rule_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (combo_preset_id, module_id),
  constraint combo_preset_modules_order_unique unique (combo_preset_id, display_order),
  constraint combo_preset_modules_order_positive check (display_order > 0),
  constraint combo_preset_modules_dependency_object check (
    jsonb_typeof(dependency_rule_json) = 'object'
  )
);

create index combo_preset_modules_module_idx
  on public.combo_preset_modules (module_id, combo_preset_id);

create table public.assessment_mode_profiles (
  mode public.assessment_mode primary key,
  public_name text not null,
  description text not null,
  target_item_min smallint not null,
  target_item_max smallint not null,
  single_module_item_min smallint not null,
  single_module_item_max smallint not null,
  max_items_per_segment smallint not null default 120,
  seconds_per_item smallint not null default 12,
  provisional_precision_min smallint,
  provisional_precision_max smallint,
  is_selectable boolean not null default false,
  configuration_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_mode_profiles_name_not_blank check (
    length(btrim(public_name)) > 0 and length(btrim(description)) > 0
  ),
  constraint assessment_mode_profiles_item_range check (
    target_item_min between 1 and target_item_max
    and target_item_max <= 1000
    and single_module_item_min between 1 and single_module_item_max
    and single_module_item_max <= target_item_max
  ),
  constraint assessment_mode_profiles_segment_cap check (
    max_items_per_segment between 1 and 120
  ),
  constraint assessment_mode_profiles_seconds_range check (seconds_per_item between 5 and 120),
  constraint assessment_mode_profiles_precision_range check (
    (provisional_precision_min is null and provisional_precision_max is null)
    or (
      provisional_precision_min between 1 and provisional_precision_max
      and provisional_precision_max <= 99
    )
  ),
  constraint assessment_mode_profiles_config_object check (
    jsonb_typeof(configuration_json) = 'object'
  )
);

create trigger assessment_mode_profiles_set_updated_at
before update on public.assessment_mode_profiles
for each row execute function public.set_updated_at();

create table public.assessment_blueprints (
  id uuid primary key default extensions.gen_random_uuid(),
  status public.blueprint_status not null default 'draft',
  composer_version text not null,
  content_version text not null,
  mode public.assessment_mode not null,
  selection_type public.selection_type not null,
  locale text not null default 'id',
  selected_modules_json jsonb not null,
  segment_plan_json jsonb not null,
  item_count smallint not null,
  estimated_minutes smallint not null,
  segment_count smallint not null default 1,
  blueprint_hash text not null unique,
  seed_hash text not null,
  created_at timestamptz not null default now(),
  locked_at timestamptz,
  constraint assessment_blueprints_version_not_blank check (
    length(btrim(composer_version)) > 0 and length(btrim(content_version)) > 0
  ),
  constraint assessment_blueprints_locale check (locale in ('id', 'en')),
  constraint assessment_blueprints_modules_array check (
    jsonb_typeof(selected_modules_json) = 'array'
    and jsonb_array_length(selected_modules_json) > 0
  ),
  constraint assessment_blueprints_segment_plan_array check (
    jsonb_typeof(segment_plan_json) = 'array'
    and jsonb_array_length(segment_plan_json) = segment_count
  ),
  constraint assessment_blueprints_item_count_positive check (item_count between 1 and 32767),
  constraint assessment_blueprints_minutes_positive check (estimated_minutes between 1 and 32767),
  constraint assessment_blueprints_segment_count_positive check (segment_count between 1 and 100),
  constraint assessment_blueprints_hash_hex check (blueprint_hash ~ '^[0-9a-f]{64}$'),
  constraint assessment_blueprints_seed_hash_hex check (seed_hash ~ '^[0-9a-f]{64}$'),
  constraint assessment_blueprints_lock_consistent check (
    (status = 'locked' and locked_at is not null)
    or (status <> 'locked' and locked_at is null)
  )
);

create index assessment_blueprints_mode_created_idx
  on public.assessment_blueprints (mode, created_at desc);

create table public.assessment_blueprint_items (
  id uuid primary key default extensions.gen_random_uuid(),
  blueprint_id uuid not null references public.assessment_blueprints(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  module_version_id uuid not null references public.module_versions(id) on delete restrict,
  dimension_id uuid not null references public.question_dimensions(id) on delete restrict,
  segment_index smallint not null,
  section_key text not null,
  display_order integer not null,
  module_display_order smallint not null,
  scoring_role text not null default 'primary',
  consistency_pair_key text,
  created_at timestamptz not null default now(),
  constraint assessment_blueprint_items_question_unique unique (blueprint_id, question_id),
  constraint assessment_blueprint_items_order_unique unique (blueprint_id, display_order),
  constraint assessment_blueprint_items_module_order_unique unique (
    blueprint_id, module_version_id, module_display_order
  ),
  constraint assessment_blueprint_items_segment_positive check (segment_index > 0),
  constraint assessment_blueprint_items_section_format check (
    section_key ~ '^[a-z][a-z0-9_-]{1,49}$'
  ),
  constraint assessment_blueprint_items_display_positive check (
    display_order > 0 and module_display_order > 0
  ),
  constraint assessment_blueprint_items_role check (
    scoring_role in ('primary', 'secondary', 'quality', 'clarifier')
  )
);

create index assessment_blueprint_items_module_idx
  on public.assessment_blueprint_items (blueprint_id, module_version_id, display_order);
create index assessment_blueprint_items_segment_idx
  on public.assessment_blueprint_items (blueprint_id, segment_index, display_order);

alter table public.test_sessions
  add column selection_type public.selection_type not null default 'legacy',
  add column blueprint_id uuid references public.assessment_blueprints(id) on delete restrict,
  add column paused_at timestamptz,
  add column current_segment_index smallint not null default 1,
  add column last_activity_at timestamptz not null default now(),
  add constraint test_sessions_current_segment_positive check (current_segment_index > 0),
  add constraint test_sessions_pause_consistent check (
    (status = 'paused' and paused_at is not null)
    or (status <> 'paused' and paused_at is null)
  );

create unique index test_sessions_blueprint_unique
  on public.test_sessions (blueprint_id)
  where blueprint_id is not null;
create index test_sessions_status_activity_idx
  on public.test_sessions (status, last_activity_at desc);

create table public.test_session_modules (
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  module_version_id uuid not null references public.module_versions(id) on delete restrict,
  blueprint_id uuid not null references public.assessment_blueprints(id) on delete restrict,
  status public.session_module_status not null default 'pending',
  item_count smallint not null,
  required_answers smallint not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (session_id, module_version_id),
  constraint test_session_modules_item_range check (
    item_count > 0 and required_answers between 1 and item_count
  ),
  constraint test_session_modules_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index test_session_modules_blueprint_idx
  on public.test_session_modules (blueprint_id, session_id);

create table public.test_session_segments (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  blueprint_id uuid not null references public.assessment_blueprints(id) on delete restrict,
  segment_index smallint not null,
  status public.session_segment_status not null default 'pending',
  item_count smallint not null,
  required_answers smallint not null,
  started_at timestamptz,
  paused_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint test_session_segments_unique unique (session_id, segment_index),
  constraint test_session_segments_index_positive check (segment_index > 0),
  constraint test_session_segments_item_range check (
    item_count between 1 and 120 and required_answers between 1 and item_count
  ),
  constraint test_session_segments_timestamps check (
    (started_at is null or started_at >= created_at)
    and (paused_at is null or started_at is not null and paused_at >= started_at)
    and (completed_at is null or started_at is not null and completed_at >= started_at)
  )
);

create trigger test_session_segments_set_updated_at
before update on public.test_session_segments
for each row execute function public.set_updated_at();

create index test_session_segments_progress_idx
  on public.test_session_segments (session_id, status, segment_index);

alter table public.user_answers
  add column blueprint_item_id uuid references public.assessment_blueprint_items(id) on delete restrict,
  add column segment_id uuid references public.test_session_segments(id) on delete restrict,
  add column answer_revision integer not null default 1,
  add constraint user_answers_revision_positive check (answer_revision > 0);

create index user_answers_blueprint_item_idx
  on public.user_answers (blueprint_item_id)
  where blueprint_item_id is not null;
create index user_answers_segment_idx
  on public.user_answers (segment_id, answered_at)
  where segment_id is not null;

create function public.prevent_used_blueprint_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if exists (select 1 from public.test_sessions where blueprint_id = old.id) then
    raise exception 'used assessment blueprints are immutable' using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create function public.prevent_used_blueprint_item_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  target_blueprint_id uuid;
begin
  if tg_op = 'DELETE' then
    target_blueprint_id := old.blueprint_id;
  else
    target_blueprint_id := new.blueprint_id;
  end if;
  if exists (select 1 from public.test_sessions where blueprint_id = target_blueprint_id) then
    raise exception 'used assessment blueprint items are immutable' using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger assessment_blueprints_immutable
before update or delete on public.assessment_blueprints
for each row execute function public.prevent_used_blueprint_mutation();
create trigger assessment_blueprint_items_immutable
before insert or update or delete on public.assessment_blueprint_items
for each row execute function public.prevent_used_blueprint_item_mutation();

create table public.result_modules (
  id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid not null references public.personality_results(id) on delete cascade,
  module_version_id uuid not null references public.module_versions(id) on delete restrict,
  module_key text not null,
  scoring_version text not null,
  evidence_tier public.evidence_tier not null,
  confidence numeric(5,4) not null,
  completion numeric(5,4) not null,
  ambiguity_json jsonb not null default '{}'::jsonb,
  summary_json jsonb not null,
  quality_json jsonb not null,
  created_at timestamptz not null default now(),
  constraint result_modules_unique unique (result_id, module_version_id),
  constraint result_modules_key_format check (module_key ~ '^[a-z0-9_]{2,40}$'),
  constraint result_modules_version_not_blank check (length(btrim(scoring_version)) > 0),
  constraint result_modules_confidence_range check (confidence between 0 and 1),
  constraint result_modules_completion_range check (completion between 0 and 1),
  constraint result_modules_ambiguity_object check (jsonb_typeof(ambiguity_json) = 'object'),
  constraint result_modules_summary_object check (jsonb_typeof(summary_json) = 'object'),
  constraint result_modules_quality_object check (jsonb_typeof(quality_json) = 'object')
);

create index result_modules_result_idx on public.result_modules (result_id, module_key);

create table public.result_module_scores (
  id uuid primary key default extensions.gen_random_uuid(),
  result_module_id uuid not null references public.result_modules(id) on delete cascade,
  construct_key text not null,
  facet_key text not null default 'general',
  raw_score numeric(10,4) not null,
  normalized_score numeric(6,2) not null,
  confidence numeric(5,4) not null,
  rank_or_candidate_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint result_module_scores_unique unique (result_module_id, construct_key, facet_key),
  constraint result_module_scores_key_format check (
    construct_key ~ '^[a-z][a-z0-9_]{0,39}$'
    and facet_key ~ '^[a-z][a-z0-9_]{0,39}$'
  ),
  constraint result_module_scores_normalized_range check (normalized_score between 0 and 100),
  constraint result_module_scores_confidence_range check (confidence between 0 and 1),
  constraint result_module_scores_candidate_object check (
    jsonb_typeof(rank_or_candidate_json) = 'object'
  )
);

create index result_module_scores_module_idx
  on public.result_module_scores (result_module_id, construct_key, facet_key);

create table public.result_correlations (
  id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid not null references public.personality_results(id) on delete cascade,
  correlation_version text not null,
  rule_key text not null,
  kind public.correlation_kind not null,
  confidence numeric(5,4) not null,
  narrative_key text not null,
  context_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint result_correlations_unique unique (result_id, correlation_version, rule_key),
  constraint result_correlations_version_not_blank check (
    length(btrim(correlation_version)) > 0
  ),
  constraint result_correlations_rule_format check (rule_key ~ '^[a-z][a-z0-9_.-]{2,100}$'),
  constraint result_correlations_confidence_range check (confidence between 0 and 1),
  constraint result_correlations_narrative_format check (
    narrative_key ~ '^[a-z][a-z0-9_.-]{2,150}$'
  ),
  constraint result_correlations_context_object check (jsonb_typeof(context_json) = 'object')
);

create index result_correlations_result_idx
  on public.result_correlations (result_id, kind, confidence desc);

create table public.result_correlation_sources (
  correlation_id uuid not null references public.result_correlations(id) on delete cascade,
  result_module_id uuid not null references public.result_modules(id) on delete cascade,
  source_role text not null default 'input',
  created_at timestamptz not null default now(),
  primary key (correlation_id, result_module_id),
  constraint result_correlation_sources_role check (source_role in ('input', 'context'))
);

create index result_correlation_sources_module_idx
  on public.result_correlation_sources (result_module_id, correlation_id);

create table public.result_clarifiers (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  result_id uuid references public.personality_results(id) on delete cascade,
  module_version_id uuid not null references public.module_versions(id) on delete restrict,
  segment_id uuid references public.test_session_segments(id) on delete restrict,
  reason_code text not null,
  status public.clarifier_status not null,
  target_dimensions_json jsonb not null,
  item_count smallint not null,
  required boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  constraint result_clarifiers_session_module_unique unique (session_id, module_version_id),
  constraint result_clarifiers_reason_format check (reason_code ~ '^[a-z][a-z0-9_]{2,60}$'),
  constraint result_clarifiers_dimensions_array check (
    jsonb_typeof(target_dimensions_json) = 'array'
    and jsonb_array_length(target_dimensions_json) > 0
  ),
  constraint result_clarifiers_item_range check (item_count between 12 and 24),
  constraint result_clarifiers_completion_consistent check (
    (status = 'completed' and completed_at is not null and skipped_at is null)
    or (status = 'skipped' and skipped_at is not null and completed_at is null)
    or (status not in ('completed', 'skipped') and completed_at is null and skipped_at is null)
  )
);

create index result_clarifiers_session_status_idx
  on public.result_clarifiers (session_id, status, created_at desc);

create table public.result_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid not null unique references public.personality_results(id) on delete cascade,
  blueprint_id uuid references public.assessment_blueprints(id) on delete restrict,
  composer_version text not null,
  content_version text not null,
  report_template_version text not null,
  is_legacy boolean not null default false,
  created_at timestamptz not null default now(),
  constraint result_versions_not_blank check (
    length(btrim(composer_version)) > 0
    and length(btrim(content_version)) > 0
    and length(btrim(report_template_version)) > 0
  ),
  constraint result_versions_legacy_consistent check (
    not is_legacy or blueprint_id is null
  )
);

insert into public.result_versions (
  result_id, blueprint_id, composer_version, content_version,
  report_template_version, is_legacy
)
select
  id, null, 'legacy-mvp-1', scoring_version, 'legacy-mvp-1', true
from public.personality_results
on conflict (result_id) do nothing;

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text not null,
  configuration_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feature_flags_key_format check (key ~ '^[A-Z][A-Z0-9_]{2,80}$'),
  constraint feature_flags_description_not_blank check (length(btrim(description)) > 0),
  constraint feature_flags_configuration_object check (
    jsonb_typeof(configuration_json) = 'object'
  )
);

create trigger feature_flags_set_updated_at
before update on public.feature_flags
for each row execute function public.set_updated_at();

-- Every new table stays behind the trusted server boundary, including catalog data.
alter table public.question_translations enable row level security;
alter table public.question_translations force row level security;
alter table public.question_options enable row level security;
alter table public.question_options force row level security;
alter table public.question_dimension_mappings enable row level security;
alter table public.question_dimension_mappings force row level security;
alter table public.combo_presets enable row level security;
alter table public.combo_presets force row level security;
alter table public.combo_preset_modules enable row level security;
alter table public.combo_preset_modules force row level security;
alter table public.assessment_mode_profiles enable row level security;
alter table public.assessment_mode_profiles force row level security;
alter table public.assessment_blueprints enable row level security;
alter table public.assessment_blueprints force row level security;
alter table public.assessment_blueprint_items enable row level security;
alter table public.assessment_blueprint_items force row level security;
alter table public.test_session_modules enable row level security;
alter table public.test_session_modules force row level security;
alter table public.test_session_segments enable row level security;
alter table public.test_session_segments force row level security;
alter table public.result_modules enable row level security;
alter table public.result_modules force row level security;
alter table public.result_module_scores enable row level security;
alter table public.result_module_scores force row level security;
alter table public.result_correlations enable row level security;
alter table public.result_correlations force row level security;
alter table public.result_correlation_sources enable row level security;
alter table public.result_correlation_sources force row level security;
alter table public.result_clarifiers enable row level security;
alter table public.result_clarifiers force row level security;
alter table public.result_versions enable row level security;
alter table public.result_versions force row level security;
alter table public.feature_flags enable row level security;
alter table public.feature_flags force row level security;

revoke all on table public.question_translations from public, anon, authenticated;
revoke all on table public.question_options from public, anon, authenticated;
revoke all on table public.question_dimension_mappings from public, anon, authenticated;
revoke all on table public.combo_presets from public, anon, authenticated;
revoke all on table public.combo_preset_modules from public, anon, authenticated;
revoke all on table public.assessment_mode_profiles from public, anon, authenticated;
revoke all on table public.assessment_blueprints from public, anon, authenticated;
revoke all on table public.assessment_blueprint_items from public, anon, authenticated;
revoke all on table public.test_session_modules from public, anon, authenticated;
revoke all on table public.test_session_segments from public, anon, authenticated;
revoke all on table public.result_modules from public, anon, authenticated;
revoke all on table public.result_module_scores from public, anon, authenticated;
revoke all on table public.result_correlations from public, anon, authenticated;
revoke all on table public.result_correlation_sources from public, anon, authenticated;
revoke all on table public.result_clarifiers from public, anon, authenticated;
revoke all on table public.result_versions from public, anon, authenticated;
revoke all on table public.feature_flags from public, anon, authenticated;

revoke all on function public.prevent_published_module_version_mutation()
  from public, anon, authenticated;
revoke all on function public.prevent_published_module_content_mutation()
  from public, anon, authenticated;
revoke all on function public.prevent_used_blueprint_mutation()
  from public, anon, authenticated;
revoke all on function public.prevent_used_blueprint_item_mutation()
  from public, anon, authenticated;

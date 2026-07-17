-- PRD v2 release boundary, publication workflow, consent taxonomy, and retention cleanup.
-- Additive only. Production feature flags remain unchanged and default-off.

create type public.release_disposition as enum (
  'RELEASE_READY',
  'DEFERRED_WITH_REASON',
  'BLOCKED_EXTERNAL'
);

alter table public.modules
  add column release_disposition public.release_disposition not null default 'RELEASE_READY',
  add column availability_reason text,
  add constraint modules_release_disposition_consistent check (
    release_disposition = 'RELEASE_READY'
    or (
      not is_selectable
      and availability_reason is not null
      and length(btrim(availability_reason)) between 12 and 500
    )
  );

create index modules_release_disposition_idx
  on public.modules (release_disposition, default_order);

create table public.consent_policy_versions (
  consent_type public.consent_type not null,
  version text not null,
  purpose text not null,
  required_for_core boolean not null default false,
  retention_policy_key text not null,
  status public.module_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (consent_type, version),
  constraint consent_policy_versions_text check (
    length(btrim(version)) > 0
    and length(btrim(purpose)) between 12 and 1000
    and retention_policy_key ~ '^[a-z][a-z0-9_]{2,49}$'
  ),
  constraint consent_policy_versions_publication check (
    status not in ('published', 'retired') or published_at is not null
  )
);

create table public.retention_policies (
  key text primary key,
  subject text not null,
  retention_days integer,
  deletion_action text not null,
  legal_or_security_basis text,
  status public.module_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retention_policies_key check (key ~ '^[a-z][a-z0-9_]{2,49}$'),
  constraint retention_policies_subject check (length(btrim(subject)) between 3 and 100),
  constraint retention_policies_days check (retention_days is null or retention_days between 1 and 3650),
  constraint retention_policies_action check (deletion_action in ('hard_delete', 'user_controlled', 'rolling_cleanup')),
  constraint retention_policies_publication check (
    status not in ('published', 'retired') or published_at is not null
  )
);

create trigger retention_policies_set_updated_at
before update on public.retention_policies
for each row execute function public.set_updated_at();

create table public.content_publication_events (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_account_id uuid references public.accounts(id) on delete set null,
  resource_type text not null,
  resource_id uuid,
  action text not null,
  from_status text,
  to_status text,
  reason text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint content_publication_events_resource check (
    resource_type in ('question', 'module_version', 'combo_preset', 'feature_flag')
  ),
  constraint content_publication_events_action check (
    action in ('review_transition', 'publish', 'retire', 'flag_change')
  ),
  constraint content_publication_events_reason check (length(btrim(reason)) between 8 and 500),
  constraint content_publication_events_metadata check (jsonb_typeof(metadata_json) = 'object')
);

create function public.prevent_content_publication_event_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'content publication events are append-only' using errcode = '55000';
end;
$$;

create trigger content_publication_events_append_only
before update or delete on public.content_publication_events
for each row execute function public.prevent_content_publication_event_mutation();

create function public.transition_question_review(
  target_question_id uuid,
  expected_status public.review_status,
  next_status public.review_status,
  actor_id uuid,
  transition_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_status public.review_status;
  current_version_status public.module_status;
begin
  if length(btrim(transition_reason)) < 8 then
    raise exception 'review transition reason is required' using errcode = '22023';
  end if;

  select questions.review_status, module_versions.status
  into current_status, current_version_status
  from public.questions
  inner join public.module_versions on module_versions.id = questions.module_version_id
  where questions.id = target_question_id
  for update of questions;

  if current_status is null then
    raise exception 'question not found' using errcode = 'P0002';
  end if;
  if current_status <> expected_status then
    raise exception 'question review status changed concurrently' using errcode = '40001';
  end if;
  if current_version_status in ('published', 'retired') then
    raise exception 'published module content is immutable' using errcode = '55000';
  end if;

  if not (
    (expected_status = 'draft' and next_status = 'language_review')
    or (expected_status = 'language_review' and next_status = 'construct_review')
    or (expected_status = 'construct_review' and next_status = 'bias_review')
    or (expected_status = 'bias_review' and next_status = 'pilot')
    or (expected_status = 'pilot' and next_status in ('approved', 'rejected'))
  ) then
    raise exception 'invalid review transition' using errcode = '22023';
  end if;

  update public.questions set review_status = next_status where id = target_question_id;
  insert into public.content_publication_events (
    actor_account_id, resource_type, resource_id, action, from_status, to_status, reason
  ) values (
    actor_id, 'question', target_question_id, 'review_transition', expected_status::text,
    next_status::text, transition_reason
  );
end;
$$;

create function public.publish_module_version(
  target_module_version_id uuid,
  actor_id uuid,
  publication_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_status public.module_status;
  target_module_id uuid;
  target_disposition public.release_disposition;
  question_count integer;
  approved_count integer;
  translation_count integer;
begin
  if length(btrim(publication_reason)) < 8 then
    raise exception 'publication reason is required' using errcode = '22023';
  end if;

  select module_versions.status, module_versions.module_id, modules.release_disposition
  into current_status, target_module_id, target_disposition
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where module_versions.id = target_module_version_id
  for update of module_versions;

  if current_status is null then
    raise exception 'module version not found' using errcode = 'P0002';
  end if;
  if current_status not in ('draft', 'pilot') then
    raise exception 'module version is not publishable' using errcode = '55000';
  end if;
  if target_disposition <> 'RELEASE_READY' then
    raise exception 'module is not release-ready' using errcode = '55000';
  end if;

  select count(*), count(*) filter (where review_status = 'approved')
  into question_count, approved_count
  from public.questions
  where module_version_id = target_module_version_id and status <> 'retired';

  select count(*)
  into translation_count
  from public.question_translations
  inner join public.questions on questions.id = question_translations.question_id
  where questions.module_version_id = target_module_version_id
    and question_translations.locale = 'id'
    and question_translations.review_status = 'approved';

  if question_count < 12 or approved_count <> question_count or translation_count <> question_count then
    raise exception 'module version publication gate failed' using errcode = '55000';
  end if;

  update public.module_versions
  set status = 'published', published_at = now()
  where id = target_module_version_id;

  update public.modules
  set status = 'published', is_selectable = true
  where id = target_module_id;

  insert into public.content_publication_events (
    actor_account_id, resource_type, resource_id, action, from_status, to_status, reason,
    metadata_json
  ) values (
    actor_id, 'module_version', target_module_version_id, 'publish', current_status::text,
    'published', publication_reason, jsonb_build_object('questionCount', question_count)
  );
end;
$$;

create function public.publish_combo_preset(
  target_combo_preset_id uuid,
  actor_id uuid,
  publication_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_status public.module_status;
  module_count integer;
  invalid_count integer;
begin
  if length(btrim(publication_reason)) < 8 then
    raise exception 'publication reason is required' using errcode = '22023';
  end if;

  select status into current_status
  from public.combo_presets
  where id = target_combo_preset_id
  for update;

  if current_status is null then
    raise exception 'combo preset not found' using errcode = 'P0002';
  end if;
  if current_status not in ('draft', 'pilot') then
    raise exception 'combo preset is not publishable' using errcode = '55000';
  end if;

  select count(*), count(*) filter (
    where modules.release_disposition <> 'RELEASE_READY'
      or not modules.is_selectable
      or module_versions.status <> 'published'
      or combo_preset_modules.module_version_id is null
  )
  into module_count, invalid_count
  from public.combo_preset_modules
  inner join public.modules on modules.id = combo_preset_modules.module_id
  left join public.module_versions on module_versions.id = combo_preset_modules.module_version_id
  where combo_preset_modules.combo_preset_id = target_combo_preset_id
    and combo_preset_modules.required;

  if module_count < 2 or invalid_count > 0 then
    raise exception 'combo preset publication gate failed' using errcode = '55000';
  end if;

  update public.combo_presets
  set status = 'published', published_at = now()
  where id = target_combo_preset_id;

  insert into public.content_publication_events (
    actor_account_id, resource_type, resource_id, action, from_status, to_status, reason,
    metadata_json
  ) values (
    actor_id, 'combo_preset', target_combo_preset_id, 'publish', current_status::text,
    'published', publication_reason, jsonb_build_object('requiredModuleCount', module_count)
  );
end;
$$;

create function public.set_feature_flag_state(
  target_key text,
  expected_enabled boolean,
  next_enabled boolean,
  actor_id uuid,
  change_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_enabled boolean;
begin
  if length(btrim(change_reason)) < 8 then
    raise exception 'feature flag change reason is required' using errcode = '22023';
  end if;

  select enabled into current_enabled
  from public.feature_flags
  where key = target_key
  for update;

  if current_enabled is null then
    raise exception 'feature flag not found' using errcode = 'P0002';
  end if;
  if current_enabled <> expected_enabled then
    raise exception 'feature flag changed concurrently' using errcode = '40001';
  end if;

  update public.feature_flags set enabled = next_enabled, updated_at = now() where key = target_key;
  insert into public.content_publication_events (
    actor_account_id, resource_type, action, from_status, to_status, reason, metadata_json
  ) values (
    actor_id, 'feature_flag', 'flag_change', current_enabled::text, next_enabled::text,
    change_reason, jsonb_build_object('key', target_key)
  );
end;
$$;

create function public.cleanup_expired_retention_data(reference_time timestamptz default now())
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
end;
$$;

alter table public.consent_policy_versions enable row level security;
alter table public.consent_policy_versions force row level security;
alter table public.retention_policies enable row level security;
alter table public.retention_policies force row level security;
alter table public.content_publication_events enable row level security;
alter table public.content_publication_events force row level security;

revoke all on table public.consent_policy_versions from public, anon, authenticated;
revoke all on table public.retention_policies from public, anon, authenticated;
revoke all on table public.content_publication_events from public, anon, authenticated;
revoke all on function public.transition_question_review(uuid, public.review_status, public.review_status, uuid, text) from public, anon, authenticated;
revoke all on function public.publish_module_version(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.publish_combo_preset(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.set_feature_flag_state(text, boolean, boolean, uuid, text) from public, anon, authenticated;
revoke all on function public.cleanup_expired_retention_data(timestamptz) from public, anon, authenticated;
revoke all on function public.prevent_content_publication_event_mutation() from public, anon, authenticated;

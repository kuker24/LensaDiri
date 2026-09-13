-- Server-authoritative five-lens collectible journey. Existing assessment and
-- result rows remain immutable; this aggregate only references their provenance.

create table public.identity_journeys (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  journey_token_hash text not null unique,
  plan_version text not null default 'identity-journey-1',
  character_gender text not null,
  status text not null default 'active',
  current_position smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint identity_journeys_token_hash_hex check (journey_token_hash ~ '^[0-9a-f]{64}$'),
  constraint identity_journeys_plan_not_blank check (length(btrim(plan_version)) > 0),
  constraint identity_journeys_gender check (character_gender in ('perempuan', 'laki')),
  constraint identity_journeys_status check (status in ('active', 'completed', 'revoked')),
  constraint identity_journeys_position check (current_position between 1 and 5),
  constraint identity_journeys_expiry check (expires_at > created_at),
  constraint identity_journeys_completion_consistent check (
    (status = 'completed' and completed_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null and completed_at is null)
    or (status = 'active' and completed_at is null and revoked_at is null)
  )
);

create trigger identity_journeys_set_updated_at
before update on public.identity_journeys
for each row execute function public.set_updated_at();

create index identity_journeys_account_activity_idx
  on public.identity_journeys (account_id, last_activity_at desc)
  where account_id is not null and status = 'active';
create index identity_journeys_expiry_idx
  on public.identity_journeys (expires_at)
  where account_id is null and status = 'active';

create table public.identity_journey_steps (
  id uuid primary key default extensions.gen_random_uuid(),
  journey_id uuid not null references public.identity_journeys(id) on delete cascade,
  position smallint not null,
  module_key text not null,
  required boolean not null,
  status text not null default 'locked',
  session_id uuid unique references public.test_sessions(id) on delete set null,
  result_id uuid unique references public.personality_results(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint identity_journey_steps_position_unique unique (journey_id, position),
  constraint identity_journey_steps_module_unique unique (journey_id, module_key),
  constraint identity_journey_steps_status check (status in ('locked', 'available', 'active', 'completed')),
  constraint identity_journey_steps_plan check (
    (position = 1 and module_key = 'type_16' and required)
    or (position = 2 and module_key = 'enneagram' and not required)
    or (position = 3 and module_key = 'socionics_communication' and not required)
    or (position = 4 and module_key = 'trait_profile' and not required)
    or (position = 5 and module_key = 'psychosophy' and not required)
  ),
  -- `session_id` and `result_id` are `on delete set null`, so retention cleanup and
  -- account erasure may detach a claimed step. Timestamps stay authoritative for
  -- state; the references are provenance that is allowed to disappear.
  constraint identity_journey_steps_state_consistent check (
    (status in ('locked', 'available') and session_id is null and result_id is null
      and started_at is null and completed_at is null)
    or (status = 'active' and result_id is null
      and started_at is not null and completed_at is null)
    or (status = 'completed'
      and started_at is not null and completed_at is not null)
  )
);

create unique index identity_journey_steps_one_active_idx
  on public.identity_journey_steps (journey_id)
  where status = 'active';
create index identity_journey_steps_progress_idx
  on public.identity_journey_steps (journey_id, position, status);

alter table public.identity_journeys enable row level security;
alter table public.identity_journeys force row level security;
alter table public.identity_journey_steps enable row level security;
alter table public.identity_journey_steps force row level security;

revoke all on table public.identity_journeys from public, anon, authenticated;
revoke all on table public.identity_journey_steps from public, anon, authenticated;

-- Journey reads own a dedicated bucket so their limit is not confused with resume.
alter table public.rate_limits drop constraint rate_limits_route_key;
alter table public.rate_limits
  add constraint rate_limits_route_key check (
    route_key in (
      'auth_register', 'auth_login', 'auth_session', 'auth_logout',
      'auth_forgot_password', 'auth_verify_email', 'auth_reset_password',
      'auth_oidc_start', 'auth_oidc_callback', 'account_delete',
      'assessment_estimate', 'assessment_start', 'assessment_answer',
      'assessment_pause', 'assessment_resume', 'assessment_complete',
      'assessment_clarifier', 'assessment_journey_read',
      'result_share', 'result_export', 'result_delete',
      'result_feedback'
    )
  );

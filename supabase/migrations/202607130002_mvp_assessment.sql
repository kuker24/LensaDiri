-- MVP assessment core. Trusted Next.js server remains sole data boundary.

alter table public.rate_limits
  drop constraint rate_limits_route_key;

alter table public.rate_limits
  add constraint rate_limits_route_key check (
    route_key in (
      'auth_register', 'auth_login', 'auth_session', 'auth_logout', 'account_delete',
      'assessment_start', 'assessment_answer', 'assessment_complete',
      'result_share', 'result_export', 'result_delete'
    )
  );

create type public.evidence_tier as enum ('A', 'B', 'C', 'EXPERIMENTAL');
create type public.module_status as enum ('draft', 'active', 'retired');
create type public.assessment_mode as enum ('quick', 'standard');
create type public.assessment_status as enum ('active', 'completed', 'expired');
create type public.result_visibility as enum ('private', 'shared');

create table public.modules (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique,
  public_name text not null,
  description text not null,
  evidence_tier public.evidence_tier not null,
  status public.module_status not null default 'draft',
  created_at timestamptz not null default now(),
  constraint modules_key_format check (key ~ '^[a-z0-9_]{2,40}$'),
  constraint modules_text_not_blank check (
    length(btrim(public_name)) > 0 and length(btrim(description)) > 0
  )
);

create table public.module_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  version text not null,
  scoring_strategy text not null,
  status public.module_status not null default 'draft',
  config_json jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  constraint module_versions_unique unique (module_id, version),
  constraint module_versions_text_not_blank check (
    length(btrim(version)) > 0 and length(btrim(scoring_strategy)) > 0
  ),
  constraint module_versions_config_object check (jsonb_typeof(config_json) = 'object')
);

create table public.question_dimensions (
  id uuid primary key default extensions.gen_random_uuid(),
  module_version_id uuid not null references public.module_versions(id) on delete cascade,
  construct_key text not null,
  label text not null,
  description text not null,
  constraint question_dimensions_unique unique (module_version_id, construct_key),
  constraint question_dimensions_key_format check (construct_key ~ '^[a-z][a-z0-9_]{0,39}$')
);

create table public.questions (
  id uuid primary key default extensions.gen_random_uuid(),
  module_version_id uuid not null references public.module_versions(id) on delete cascade,
  dimension_id uuid not null references public.question_dimensions(id) on delete restrict,
  item_code text not null,
  public_text text not null,
  polarity smallint not null,
  weight numeric(6,3) not null default 1,
  quick_enabled boolean not null default false,
  display_order integer not null,
  status public.module_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_item_code_unique unique (module_version_id, item_code),
  constraint questions_display_order_unique unique (module_version_id, display_order),
  constraint questions_item_code_format check (item_code ~ '^[A-Z0-9_]{2,40}$'),
  constraint questions_text_not_blank check (length(btrim(public_text)) > 0),
  constraint questions_polarity check (polarity in (-1, 1)),
  constraint questions_weight_positive check (weight > 0),
  constraint questions_display_order_positive check (display_order > 0)
);

create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create table public.test_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  session_token_hash text not null unique,
  status public.assessment_status not null default 'active',
  mode public.assessment_mode not null,
  locale text not null default 'id',
  consent_version text not null,
  module_version_id uuid not null references public.module_versions(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null,
  constraint test_sessions_token_hash_hex check (session_token_hash ~ '^[0-9a-f]{64}$'),
  constraint test_sessions_locale check (locale in ('id', 'en')),
  constraint test_sessions_consent_not_blank check (length(btrim(consent_version)) > 0),
  constraint test_sessions_expiry_after_start check (expires_at > started_at),
  constraint test_sessions_completion_consistent check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  )
);

create index test_sessions_account_created_idx on public.test_sessions (account_id, started_at desc)
  where account_id is not null;
create index test_sessions_expiry_idx on public.test_sessions (expires_at)
  where status = 'active';

alter table public.consents
  add constraint consents_session_id_fkey
  foreign key (session_id) references public.test_sessions(id) on delete cascade;

create table public.user_answers (
  id uuid primary key default extensions.gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  raw_value smallint not null,
  answered_at timestamptz not null default now(),
  response_time_ms integer,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_answers_session_question_unique unique (session_id, question_id),
  constraint user_answers_idempotency_unique unique (idempotency_key),
  constraint user_answers_raw_value check (raw_value between 1 and 5),
  constraint user_answers_response_time check (
    response_time_ms is null or response_time_ms between 0 and 3600000
  )
);

create trigger user_answers_set_updated_at
before update on public.user_answers
for each row execute function public.set_updated_at();

create index user_answers_session_answered_idx on public.user_answers (session_id, answered_at);

create table public.personality_results (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  session_id uuid not null unique references public.test_sessions(id) on delete cascade,
  result_token_hash text not null unique,
  visibility public.result_visibility not null default 'private',
  scoring_version text not null,
  summary_json jsonb not null,
  quality_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint personality_results_token_hash_hex check (result_token_hash ~ '^[0-9a-f]{64}$'),
  constraint personality_results_version_not_blank check (length(btrim(scoring_version)) > 0),
  constraint personality_results_summary_object check (jsonb_typeof(summary_json) = 'object'),
  constraint personality_results_quality_object check (jsonb_typeof(quality_json) = 'object')
);

create trigger personality_results_set_updated_at
before update on public.personality_results
for each row execute function public.set_updated_at();

create index personality_results_account_created_idx
  on public.personality_results (account_id, created_at desc)
  where account_id is not null and deleted_at is null;

create table public.dimension_scores (
  id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid not null references public.personality_results(id) on delete cascade,
  construct_key text not null,
  raw_score numeric(8,4) not null,
  normalized_score numeric(6,2) not null,
  confidence numeric(5,4) not null,
  created_at timestamptz not null default now(),
  constraint dimension_scores_unique unique (result_id, construct_key),
  constraint dimension_scores_normalized_range check (normalized_score between 0 and 100),
  constraint dimension_scores_confidence_range check (confidence between 0 and 1)
);

create table public.result_share_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid not null references public.personality_results(id) on delete cascade,
  token_hash text not null unique,
  public_scope text not null default 'summary',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint result_share_tokens_hash_hex check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint result_share_tokens_scope check (public_scope = 'summary'),
  constraint result_share_tokens_expiry_after_creation check (expires_at > created_at),
  constraint result_share_tokens_revocation_after_creation check (
    revoked_at is null or revoked_at >= created_at
  )
);

create index result_share_tokens_result_active_idx
  on public.result_share_tokens (result_id, expires_at desc)
  where revoked_at is null;

alter table public.modules enable row level security;
alter table public.modules force row level security;
alter table public.module_versions enable row level security;
alter table public.module_versions force row level security;
alter table public.question_dimensions enable row level security;
alter table public.question_dimensions force row level security;
alter table public.questions enable row level security;
alter table public.questions force row level security;
alter table public.test_sessions enable row level security;
alter table public.test_sessions force row level security;
alter table public.user_answers enable row level security;
alter table public.user_answers force row level security;
alter table public.personality_results enable row level security;
alter table public.personality_results force row level security;
alter table public.dimension_scores enable row level security;
alter table public.dimension_scores force row level security;
alter table public.result_share_tokens enable row level security;
alter table public.result_share_tokens force row level security;

revoke all on table public.modules from public, anon, authenticated;
revoke all on table public.module_versions from public, anon, authenticated;
revoke all on table public.question_dimensions from public, anon, authenticated;
revoke all on table public.questions from public, anon, authenticated;
revoke all on table public.test_sessions from public, anon, authenticated;
revoke all on table public.user_answers from public, anon, authenticated;
revoke all on table public.personality_results from public, anon, authenticated;
revoke all on table public.dimension_scores from public, anon, authenticated;
revoke all on table public.result_share_tokens from public, anon, authenticated;

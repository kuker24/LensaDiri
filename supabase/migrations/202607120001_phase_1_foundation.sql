-- Phase 1 foundation. Apply only through trusted database migration tooling.
-- Server code is the sole access boundary for these tables. No browser role
-- receives table privileges or RLS policies. Service credentials stay server-only.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.account_role as enum ('user', 'admin', 'super_admin');
create type public.account_status as enum ('active', 'suspended', 'deleted');
create type public.consent_type as enum (
  'assessment_processing',
  'result_storage',
  'research_optional',
  'marketing_optional',
  'ai_feature_optional'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Internal maintenance trigger. Runs with invoker privileges; no client RPC exposure.';

create table public.accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  password_hash text not null,
  role public.account_role not null default 'user',
  status public.account_status not null default 'active',
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint accounts_email_not_blank check (
    email = btrim(email)
    and email_normalized ~ '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'
  ),
  constraint accounts_email_normalized check (
    email_normalized = lower(btrim(email_normalized))
    and email_normalized = lower(email)
    and length(email_normalized) <= 320
  ),
  constraint accounts_password_hash_argon2id_phc check (
    password_hash ~ '^\$argon2id\$v=19\$m=[0-9]+,t=[0-9]+,p=[0-9]+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
  ),
  constraint accounts_deleted_status_consistent check (
    (status = 'deleted' and deleted_at is not null)
    or (status <> 'deleted' and deleted_at is null)
  )
);

create unique index accounts_live_email_normalized_key
  on public.accounts (email_normalized)
  where deleted_at is null;

create index accounts_status_created_at_idx
  on public.accounts (status, created_at desc);

create trigger accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

create table public.account_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  session_token_hash text not null,
  user_agent_hash text,
  ip_hash text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  constraint account_sessions_token_hash_hex check (session_token_hash ~ '^[0-9a-f]{64}$'),
  constraint account_sessions_user_agent_hash_hex check (
    user_agent_hash is null or user_agent_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint account_sessions_ip_hash_hex check (
    ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint account_sessions_expiry_after_creation check (expires_at > created_at),
  constraint account_sessions_last_seen_after_creation check (
    last_seen_at is null or (last_seen_at >= created_at and last_seen_at <= expires_at)
  ),
  constraint account_sessions_revocation_after_creation check (
    revoked_at is null or revoked_at >= created_at
  )
);

create unique index account_sessions_token_hash_key
  on public.account_sessions (session_token_hash);
create index account_sessions_account_active_idx
  on public.account_sessions (account_id, expires_at desc)
  where revoked_at is null;
create index account_sessions_expiry_idx
  on public.account_sessions (expires_at)
  where revoked_at is null;

create table public.consents (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  -- Reserved for Phase 3 test_sessions. No parent table exists in Phase 1, so
  -- this cannot receive a foreign key until that migration introduces it.
  session_id uuid,
  consent_type public.consent_type not null,
  version text not null,
  accepted_at timestamptz,
  rejected_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint consents_subject_required check (num_nonnulls(account_id, session_id) >= 1),
  constraint consents_version_not_blank check (length(btrim(version)) > 0),
  constraint consents_decision_exactly_once check (
    num_nonnulls(accepted_at, rejected_at) = 1
  ),
  constraint consents_decision_at_or_after_creation check (
    (accepted_at is null or accepted_at >= created_at)
    and (rejected_at is null or rejected_at >= created_at)
  ),
  constraint consents_revocation_requires_acceptance check (
    revoked_at is null or (accepted_at is not null and revoked_at >= accepted_at)
  )
);

comment on table public.consents is
  'Append-only consent ledger. Revocation is recorded as a new row or revoked_at; never overwrite a decision.';

create index consents_account_type_created_idx
  on public.consents (account_id, consent_type, created_at desc)
  where account_id is not null;
create index consents_session_type_created_idx
  on public.consents (session_id, consent_type, created_at desc)
  where session_id is not null;

create table public.rate_limits (
  id uuid primary key default extensions.gen_random_uuid(),
  key_hash text not null,
  route_key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  created_at timestamptz not null default now(),
  constraint rate_limits_key_hash_hex check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint rate_limits_route_key check (
    route_key in ('auth_register', 'auth_login', 'auth_session', 'auth_logout')
  ),
  constraint rate_limits_count_positive check (count >= 1 and count <= 2147483647),
  constraint rate_limits_window_start_utc_minute check (
    date_trunc('minute', window_start) = window_start
  )
);

create unique index rate_limits_bucket_key
  on public.rate_limits (key_hash, route_key, window_start);
create index rate_limits_expiry_idx
  on public.rate_limits (window_start);

create table public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_account_id uuid references public.accounts(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (
    action in (
      'account_registered',
      'account_login_succeeded',
      'account_login_failed',
      'account_logout',
      'account_session_revoked',
      'consent_recorded',
      'consent_revoked',
      'admin_accessed',
      'admin_content_changed'
    )
  ),
  constraint audit_logs_entity_type_not_blank check (
    entity_type in ('account', 'account_session', 'consent', 'admin_resource', 'system')
  ),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata_json) = 'object')
);

comment on column public.audit_logs.metadata_json is
  'Operational metadata only. Never store passwords, raw tokens, raw answers, private results, IP addresses, or user-agent strings.';
comment on table public.audit_logs is
  'Append-only audit ledger. Trusted server code inserts records; updates and deletes are prohibited by application contract.';

create index audit_logs_actor_created_idx
  on public.audit_logs (actor_account_id, created_at desc)
  where actor_account_id is not null;
create index audit_logs_entity_created_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'audit logs are append-only' using errcode = '55000';
end;
$$;

create trigger audit_logs_append_only
before update or delete on public.audit_logs
for each row
execute function public.prevent_audit_log_mutation();

alter table public.accounts enable row level security;
alter table public.accounts force row level security;
alter table public.account_sessions enable row level security;
alter table public.account_sessions force row level security;
alter table public.consents enable row level security;
alter table public.consents force row level security;
alter table public.rate_limits enable row level security;
alter table public.rate_limits force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

-- Explicit default deny. Do not add direct browser policies to these tables.
revoke all on table public.accounts from public, anon, authenticated;
revoke all on table public.account_sessions from public, anon, authenticated;
revoke all on table public.consents from public, anon, authenticated;
revoke all on table public.rate_limits from public, anon, authenticated;
revoke all on table public.audit_logs from public, anon, authenticated;
-- UUID primary keys need no application sequences. Schema usage remains intact for
-- trusted APIs; table-level privileges above deny all direct browser access.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_audit_log_mutation() from public, anon, authenticated;

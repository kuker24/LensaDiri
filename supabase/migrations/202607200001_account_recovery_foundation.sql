-- Add hash-only, single-use account verification and password-reset capabilities.
-- Delivery remains server-owned and production-disabled until an email provider is approved.

create type public.account_recovery_purpose as enum ('email_verification', 'password_reset');

create table public.account_recovery_tokens (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  purpose public.account_recovery_purpose not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  delivered_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint account_recovery_tokens_hash_hex check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint account_recovery_tokens_expiry_after_creation check (expires_at > created_at),
  constraint account_recovery_tokens_delivered_after_creation check (
    delivered_at is null or delivered_at >= created_at
  ),
  constraint account_recovery_tokens_consumed_after_delivery check (
    consumed_at is null or delivered_at is not null and consumed_at >= delivered_at
  )
);

create index account_recovery_tokens_account_purpose_created_idx
  on public.account_recovery_tokens (account_id, purpose, created_at desc);
create index account_recovery_tokens_active_expiry_idx
  on public.account_recovery_tokens (expires_at)
  where delivered_at is not null and consumed_at is null;
create unique index account_recovery_tokens_one_active
  on public.account_recovery_tokens (account_id, purpose)
  where delivered_at is not null and consumed_at is null;

alter table public.account_recovery_tokens enable row level security;
alter table public.account_recovery_tokens force row level security;
revoke all on table public.account_recovery_tokens from public, anon, authenticated;

alter table public.rate_limits drop constraint rate_limits_route_key;
alter table public.rate_limits
  add constraint rate_limits_route_key check (
    route_key in (
      'auth_register', 'auth_login', 'auth_session', 'auth_logout', 'account_delete',
      'auth_forgot_password', 'auth_verify_email', 'auth_reset_password',
      'assessment_estimate', 'assessment_start', 'assessment_answer',
      'assessment_pause', 'assessment_resume', 'assessment_complete',
      'assessment_clarifier', 'result_share', 'result_export', 'result_delete',
      'result_feedback'
    )
  );

alter table public.audit_logs drop constraint audit_logs_action_not_blank;
alter table public.audit_logs
  add constraint audit_logs_action_not_blank check (
    action in (
      'account_registered', 'account_login_succeeded', 'account_login_failed',
      'account_logout', 'account_session_revoked', 'consent_recorded',
      'consent_revoked', 'assessment_started', 'assessment_paused',
      'assessment_resumed', 'assessment_completed', 'clarifier_started',
      'clarifier_completed', 'result_shared', 'result_share_revoked',
      'result_exported', 'result_deleted', 'admin_accessed',
      'admin_content_changed', 'module_version_published', 'combo_preset_published',
      'email_verification_requested', 'email_verified',
      'password_reset_requested', 'password_reset_completed', 'password_reset_failed'
    )
  );

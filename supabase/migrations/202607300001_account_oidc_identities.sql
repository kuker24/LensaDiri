create table public.account_oidc_identities (
  id uuid primary key default extensions.gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  provider text not null check (provider in ('google', 'apple')),
  issuer text not null check (length(issuer) between 1 and 255),
  subject text not null check (length(subject) between 1 and 255),
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  constraint account_oidc_identities_provider_subject_key unique (provider, issuer, subject),
  constraint account_oidc_identities_account_provider_key unique (account_id, provider)
);

create index account_oidc_identities_account_idx
  on public.account_oidc_identities (account_id);

alter table public.account_oidc_identities enable row level security;
alter table public.account_oidc_identities force row level security;

revoke all on table public.account_oidc_identities from public, anon, authenticated;

alter table public.account_sessions
  add column authenticated_with text not null default 'password'
  check (authenticated_with in ('password', 'google', 'apple'));

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
      'password_reset_requested', 'password_reset_completed', 'password_reset_failed',
      'oidc_identity_linked'
    )
  );

alter table public.rate_limits drop constraint rate_limits_route_key;
alter table public.rate_limits
  add constraint rate_limits_route_key check (
    route_key in (
      'auth_register', 'auth_login', 'auth_session', 'auth_logout',
      'auth_forgot_password', 'auth_verify_email', 'auth_reset_password',
      'auth_oidc_start', 'auth_oidc_callback', 'account_delete',
      'assessment_estimate', 'assessment_start', 'assessment_answer',
      'assessment_pause', 'assessment_resume', 'assessment_complete',
      'assessment_clarifier', 'result_share', 'result_export', 'result_delete',
      'result_feedback'
    )
  );

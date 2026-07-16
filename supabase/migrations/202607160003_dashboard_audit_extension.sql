-- Extend the append-only audit taxonomy for authenticated dashboard resume operations.

alter table public.audit_logs
  drop constraint audit_logs_action_not_blank,
  drop constraint audit_logs_entity_type_not_blank;

alter table public.audit_logs
  add constraint audit_logs_action_not_blank check (
    action in (
      'account_registered',
      'account_login_succeeded',
      'account_login_failed',
      'account_logout',
      'account_session_revoked',
      'consent_recorded',
      'consent_revoked',
      'assessment_resumed',
      'admin_accessed',
      'admin_content_changed'
    )
  ),
  add constraint audit_logs_entity_type_not_blank check (
    entity_type in (
      'account',
      'account_session',
      'assessment_session',
      'consent',
      'admin_resource',
      'system'
    )
  );

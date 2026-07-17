-- Normalize the audit taxonomy after the modular foundation.
-- This migration is still pending on production and intentionally repeats the
-- canonical constraints so candidate upgrades and clean resets converge.

alter table public.audit_logs
  drop constraint audit_logs_action_not_blank,
  drop constraint audit_logs_entity_type_not_blank;

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
  ),
  add constraint audit_logs_entity_type_not_blank check (
    entity_type in (
      'account', 'account_session', 'consent', 'assessment_session',
      'assessment_blueprint', 'result', 'result_share', 'module_version',
      'combo_preset', 'admin_resource', 'system'
    )
  );

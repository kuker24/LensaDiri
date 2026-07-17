-- PRD v2 enum extensions live in a dedicated committed migration so later
-- migrations can safely use the new labels on PostgreSQL 15 and newer.

alter type public.account_role add value if not exists 'content_editor';
alter type public.account_role add value if not exists 'psychometric_reviewer';
alter type public.evidence_tier add value if not exists 'B_EXPERIMENTAL';
alter type public.module_status add value if not exists 'pilot';
alter type public.module_status add value if not exists 'published';
alter type public.module_status add value if not exists 'paused';
alter type public.module_status add value if not exists 'experimental';
alter type public.assessment_mode add value if not exists 'deep';
alter type public.assessment_status add value if not exists 'paused';
alter type public.assessment_status add value if not exists 'clarifier_required';
alter type public.assessment_status add value if not exists 'revoked';

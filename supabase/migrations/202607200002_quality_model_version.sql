-- Additive quality-model provenance for versioned confidence (PRD §15.4).
-- Existing blueprints backfill to 'module-quality-1' (legacy formula, unchanged
-- numbers). New modular sessions pin 'module-quality-2'. The column is not part
-- of the blueprint hash, so seed-replay output stays deterministic.

alter table public.assessment_blueprints
  add column quality_model_version text not null default 'module-quality-1';

alter table public.assessment_blueprints
  add constraint assessment_blueprints_quality_model_version check (
    quality_model_version in ('module-quality-1', 'module-quality-2')
  );

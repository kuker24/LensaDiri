-- Production repair: make the Trait journey item bank usable in Complex mode.
--
-- The combined five-lens sitting runs in `deep`, and its Trait quota is 60. In
-- production every item of `trait_profile` `journey-1` was `{quick,standard}` or
-- `{standard}`, so zero items were deep-eligible, the composer could never fill
-- the quota, and `hasAssessmentCandidateCapacity` failed closed. Every attempt
-- to start the run returned `module_unavailable`.
--
-- `202609120002` builds the journey item bank by copying `mode_eligibility` from
-- `modular-1`. In production that version predates the deep-mode repair, which
-- landed as a separate `modular-2` in `202607290002` precisely because published
-- content is immutable. The journey copy therefore inherited the pre-repair
-- shape. Local databases build `modular-1` from seed with `deep` already
-- present, so the defect could not reproduce outside production and the e2e
-- suite passed against a database that never had the production shape.
--
-- `journey-1` is `experimental`, not `published` or `retired`, so its content is
-- still mutable and no immutability trigger is bypassed here. The update only
-- appends `deep`; quick and standard membership, item identity, ordering,
-- polarity, weight, dimensions, and scoring version all stay untouched, so no
-- existing result or blueprint changes meaning. Guarded on the absence of
-- `deep`, so replaying this migration is a no-op.
update public.questions as q
set mode_eligibility = q.mode_eligibility || array['deep']::text[]
from public.module_versions as mv
inner join public.modules as m on m.id = mv.module_id
where q.module_version_id = mv.id
  and m.key = 'trait_profile'
  and mv.scoring_version = 'trait-profile-journey-1'
  and mv.status = 'experimental'
  and not ('deep' = any(q.mode_eligibility));

-- Fail loudly rather than deploy a half-repaired bank. A database that has the
-- journey bank must now cover the full 60-item deep quota. Zero is the legitimate
-- state of a migration-only database, where journey content arrives from reviewed
-- seed content rather than from this migration.
do $$
declare
  deep_items integer;
  total_items integer;
begin
  select
    count(*) filter (where 'deep' = any(questions.mode_eligibility)),
    count(*)
  into deep_items, total_items
  from public.questions
  inner join public.module_versions on module_versions.id = questions.module_version_id
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile'
    and module_versions.scoring_version = 'trait-profile-journey-1';

  if total_items > 0 and deep_items <> total_items then
    raise exception
      'trait journey deep eligibility incomplete: % of % items eligible',
      deep_items, total_items
      using errcode = '55000';
  end if;
end $$;

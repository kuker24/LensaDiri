-- Single-sitting identity journey: one session and one result may claim all five steps.
--
-- Background. The journey was built as five sequential sessions: one lens per
-- session, one session per step. `session_id` and `result_id` were therefore
-- `unique`, which encoded "one step owns one session" as a schema invariant.
--
-- The product now runs all five lenses in a single Complex session. Modular
-- scoring already writes one `result_modules` row per lens inside one result
-- (`src/server/repositories/assessment.ts`), so the combined shape needs no
-- scoring change. Only this table refused it: five steps cannot reference the
-- same `session_id`/`result_id` while those columns stay `unique`.
--
-- What changes. The two single-column unique constraints are dropped and
-- replaced by per-journey unique constraints. A session or result may now be
-- claimed by several steps, but only within one journey — a session can never
-- be shared across two different journeys, which is the invariant that actually
-- protects one user's steps from another's.
--
-- What does NOT change. `(journey_id, position)` and `(journey_id, module_key)`
-- stay unique, so a journey still holds exactly five distinct lenses in fixed
-- order. Plan order, status vocabulary, and state consistency are untouched.
--
-- Reversibility. Dropping the replacements and restoring the single-column
-- unique constraints reverts this, but only while no journey has two steps
-- sharing a session. Combined journeys must be removed first.

alter table public.identity_journey_steps
  drop constraint identity_journey_steps_session_id_key;
alter table public.identity_journey_steps
  drop constraint identity_journey_steps_result_id_key;

-- These are lookup indexes, deliberately NOT unique. A combined sitting points
-- all five steps at the same session and the same result, so any uniqueness over
-- `(journey_id, session_id)` or `(journey_id, result_id)` would reject exactly
-- the shape this migration exists to allow.
--
-- What still keeps a journey well-formed is `(journey_id, position)` and
-- `(journey_id, module_key)`, both already unique and untouched: five distinct
-- lenses, fixed order, no duplicates. Uniqueness belongs on the step's identity,
-- not on the session it happens to share.
create index identity_journey_steps_journey_session_idx
  on public.identity_journey_steps (journey_id, session_id)
  where session_id is not null;
create index identity_journey_steps_journey_result_idx
  on public.identity_journey_steps (journey_id, result_id)
  where result_id is not null;

-- A session reachable from two different journeys is not blocked at the schema
-- level; expressing it would need a trigger or an exclusion constraint. The
-- server never attaches an existing session to a second journey — sessions are
-- minted inside the same transaction that creates their journey — so this stays
-- a code invariant, deliberately not a schema one.

-- The combined flow activates all five steps at once, so "exactly one active
-- step per journey" no longer holds. Sequential journeys keep their guarantee
-- through the plan and state-consistency checks, which are unchanged.
drop index public.identity_journey_steps_one_active_idx;

comment on index public.identity_journey_steps_journey_session_idx is
  'Lookup only, not unique: a combined sitting points all five steps at one session.';

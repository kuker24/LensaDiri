# Project Handoff

> Refreshed 2026-07-22 (post PR #24 squash-merge). Supersedes stale `phase-1-foundation`/PR #3 snapshot.

## Current objective

Ship remaining modular lenses safely without unapproved production action. Engineering for all 10 lenses is complete and local-verified on `agent/complete-all-lenses-release-ready`. Production activation of the 6 guarded lenses needs separate approval.

Do not: apply candidate migration `202607270001` to production, activate `FEATURE_COMPLEX_MODE`/`FEATURE_PROVISIONAL_PRECISION`/`FEATURE_AI_NARRATIVE`, run hosted dry-run/backup/seed/deploy/alias, change Vercel env, expose secrets, or merge without green CI.

## Current git state

- Active branch: `main`, HEAD `47b8303 Fix assessment answer persistence race (#24)`, synced with origin.
- PR #24 squash-merged 2026-07-22 (answer-persistence race fix + `sharp ^0.35.3` override clearing libvips CVEs). All CI green: `Quality and build` + `Database and browser tests`.
- Merged history through PR #24. Prior stale snapshots referenced `agent/phase-1-foundation` / PR #3 (obsolete).
- All-lenses release work lives on `agent/complete-all-lenses-release-ready` (from `origin/main` `38c982f`); not yet merged.

## Production state (per MODULAR_RELEASE_READINESS.md)

- URL `https://lensadiri.vercel.app`, Supabase hosted Singapore.
- Modular schema + quality-model applied through migration `202607200002`.
- `FEATURE_MODULAR_COMPOSER` = ON. `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, `FEATURE_AI_NARRATIVE` = OFF.
- 10 canonical modules present, all `is_selectable=true` with honest per-module tiers.
- Legacy Quick 40/Standard 60 remains backward-compatible baseline.

## Module tiers (10 lenses)

| Tier           | Modules                                    |
| -------------- | ------------------------------------------ |
| `active`       | Trait Profile                              |
| `published`    | 16-Type, Enneagram, Temperament            |
| `pilot`        | Three Center, Instinct, RIASEC, Attachment |
| `experimental` | Socionics, Psychosophy                     |

## Completed engineering scope

- 6 new independent scoring engines (three-center, instinct, socionics, riasec, attachment, psychosophy); registry covers all 10 module keys, version-aware, fail-closed on unknown version.
- Immutable composer/blueprint, provenance mismatch rejected pre-composition.
- Complex lifecycle (pause/resume/segment/atomic completion), clarifier runtime, dashboard, safe share/export/delete DTO allowlist.
- Result per-module (§17.1) + integrated report (§17.2) rendered full.
- Confidence model versioned `module-quality-2` (skipped optional, clarifier completion, item quality weight, mode depth).
- Recovery foundation implemented but dormant; live email + mandatory verification `BLOCKED_EXTERNAL`.
- Admin `/admin/*` read-only fail-closed guard; dashboard sub-routes; result/test sub-routes with opaque token; blog with slug allowlist.
- Candidate migration `202607270001_guarded_all_lenses_release.sql` (additive, fail-closed, no flag changes) — PENDING production.

## Remaining steps

1. Answer-persistence fix landed on `main` via PR #24 (DONE).
2. Push all-lenses branch, require both CI jobs green on pushed SHA: `Quality and build`, `Database and browser tests`.
3. On approval: apply `202607270001` to production via migration-only workflow, then postverify.
4. Activate guarded lenses only per product/release approval.
5. Stop after CI evidence unless production approval is explicit.

## Release blockers

- CI green on pushed candidate SHA before merge.
- Production migration `202607270001` needs approval + non-destructive dry-run + backup decision + per-step postverify.
- `FEATURE_COMPLEX_MODE` and Full Spectrum activation deferred; `full_spectrum`/`deep_self_discovery` presets stay draft.
- Provider email + mandatory verification `BLOCKED_EXTERNAL`.
- AI narrative deferred (flag OFF). Formal psychometric validation and third-party WCAG certification deferred — do not claim either.

## Resume rules

- Work in repository root, not parent workspace.
- Preserve user changes. Do not reset, clean, stash, or checkout over them.
- Do not read `.env` or print credentials.
- Use disposable local Supabase for reset, integration, pgTAP, seed, and E2E.
- Preserve legacy readers; keep production flags at documented state.
- Canonical contract: `docs/product/PRD_FULL_LensaDiri.md` v2.0. Current evidence: `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md` and `docs/deployment/MODULAR_RELEASE_READINESS.md`.

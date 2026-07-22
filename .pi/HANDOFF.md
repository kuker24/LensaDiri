# Project Handoff

> Refreshed 2026-07-22 after retention scheduler PR verification. Supersedes stale `phase-1-foundation`/PR #3 snapshot.

## Current objective

Complete production-readiness tasks sequentially without unapproved production action. Current slice: retention scheduler (least-privilege cron route, idempotent cleanup, read-only dry-run, structured logs, issue alert routing, rollback).

Do not: reapply or modify production migration `202607270001`, activate `FEATURE_COMPLEX_MODE`/`FEATURE_PROVISIONAL_PRECISION`/`FEATURE_AI_NARRATIVE`, run hosted dry-run/backup/seed/deploy/alias, change Vercel env, expose secrets, or merge without green CI.

## Current git state

- Production base: `main` / `origin/main` at `95c61c7 docs(ops): record observability drill evidence (#27)`.
- PR #25 and docs follow-up PR #27 merged 2026-07-22 after explicit approval.
- Active branch: `agent/retention-scheduler`; PR #28 open, implementation SHA `ec273615ec24ac737908bb94a64f086e49ba8f2d`.
- PR #24 squash-merged 2026-07-22 (answer-persistence race fix + `sharp ^0.35.3` override clearing libvips CVEs). All CI green: `Quality and build` + `Database and browser tests`.
- Merged history through PR #24. Prior stale snapshots referenced `agent/phase-1-foundation` / PR #3 (obsolete).
- All-lenses release work lives on `agent/complete-all-lenses-release-ready` (from `origin/main` `38c982f`); not yet merged.

## Production state (per MODULAR_RELEASE_READINESS.md)

- URL `https://lensadiri.vercel.app`, Supabase hosted Singapore.
- Modular schema + quality-model + guarded all-lenses rollout applied through migration `202607270001` (linked migration list, 2026-07-22).
- `FEATURE_MODULAR_COMPOSER` = ON. `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, `FEATURE_AI_NARRATIVE` = OFF.
- 10 canonical modules present and all selectable in production (confirmed via public `/modules/<key>` CTAs and `/combos` presets); honest per-module tiers.
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
- Migration `202607270001_guarded_all_lenses_release.sql` (additive, fail-closed, no flag changes) — APPLIED to production (confirmed via `supabase migration list --linked`, 2026-07-22). All 10 modules selectable.

## Remaining steps

1. Answer-persistence fix landed on `main` via PR #24 (DONE).
2. Guarded all-lenses rollout (`202607270001`) merged via PR #15 and applied to production (DONE); all 10 modules selectable.
3. Read-only production postcheck done (2026-07-22, SHA `51dc4e0`): 10 modules selectable, 4 pilot + 2 experimental, presets match readiness, Complex/precision OFF via API-derived signals. Still open (needs credentials/approval): direct `review_status='draft'` count for 147 items+translations, `config_json.guardedBeta` scope, and `FEATURE_AI_NARRATIVE` row. See `docs/deployment/MODULAR_RELEASE_READINESS.md` postcheck table.
4. Complex mode / provisional precision / AI narrative activation only per product/release approval.
5. Stop after evidence unless production approval is explicit.

## Observability slice

- One server-only allowlisted JSON logger is deployed. Auth/session/estimate plus assessment start, answer save, and completion emit operation/status/duration without raw user data.
- Added `npm run monitor:health`: read-only exact-payload check for `/api/health`.
- Scheduled/manual GitHub workflow is active. Failure deduplicates into one marked alert issue; recovery closes it. `drill=true` intentionally fails.
- Approved merge deployed application code through existing Vercel integration. No dependency, migration, database write, feature-flag change, Vercel configuration, or secret change.
- Local evidence: format, lint, typecheck, build, audit PASS; unit PASS 30 files/139 tests; read-only live health PASS. Docker daemon lokal unavailable.
- Merged-SHA CI `29914521598` PASS: quality/build serta disposable database/browser tests. Vercel production status PASS pada `b424395`; read-only health PASS.
- Manual healthy run `29915115034` PASS. Drill run `29915138990` failed intentionally, membuat tepat satu marked alert issue #26. Recovery run `29915169708` PASS dan menutup issue #26 otomatis.
- Workflow state `active`; first provider-scheduled run `29920936659` PASS. GitHub schedule tetap best-effort.
- Provider-level 5xx/latency/DB/flag alerts masih membutuhkan operator configuration dan approval.
- Rollback: revert PR or disable workflow; no data rollback.

## Retention scheduler slice

- Added additive migration `202607280001_retention_cleanup_preview.sql`: read-only `preview_expired_retention_data(timestamptz)` counts eligible rows without deleting; security-definer, revoked from browser roles. pgTAP `retention_cleanup_preview.test.sql` proves dry-run counts, boundary safety, no deletion, idempotent cleanup, and account-session preservation.
- Added `GET /api/cron/retention-cleanup`: `CRON_SECRET` bearer auth (constant-time, fail-closed when unset/wrong), `?dryRun=1` preview, deadline-bounded, structured `operational_event` with aggregate `retention_counts`. Reuses existing idempotent `cleanup_expired_retention_data`; account results untouched.
- Added daily Vercel cron in `vercel.json` (`0 3 * * *`) and GitHub retention monitor workflow with marker-deduplicated issue alert + recovery close; `drill=true` intentionally fails.
- `CRON_SECRET` is optional env (min 16 chars) in `env-schema`; set in Vercel + as GitHub secret before activation. Route fails closed if missing.
- Local evidence: format, lint, typecheck, build, audit PASS; unit PASS 32 files/150 tests. PR CI run `29923303552` PASS, including disposable DB, integration, pgTAP, seed replay, Playwright, and accessibility. Duplicate run `29923298628` initially hit Docker Hub rate limiting plus a concurrent port collision; failed jobs reran successfully on identical HEAD.
- PR #28 implementation checks are green at `ec273615ec24ac737908bb94a64f086e49ba8f2d`; docs-only evidence update follows that SHA.
- Not yet production-verified: cron/workflow inactive until merge; `CRON_SECRET` must be provisioned in Vercel + GitHub; scheduled/drill evidence pending merge + provisioning.
- Rollback: remove `crons` from `vercel.json` or disable in Vercel, and/or revert PR; migration is additive read-only, no data rollback.

## Release blockers

- Production content-table postcheck for the six guarded lenses still recommended (this audit confirmed selectability via public pages only).
- `FEATURE_COMPLEX_MODE` and Full Spectrum activation deferred; `full_spectrum`/`deep_self_discovery` presets stay draft.
- Provider email + mandatory verification `BLOCKED_EXTERNAL`.
- AI narrative deferred (flag OFF). Formal psychometric validation and third-party WCAG certification deferred — do not claim either.
- Observability core terbukti kecuali first provider-scheduled run dan provider-level Vercel/Supabase thresholds. Alert owner saat ini repository maintainer melalui GitHub issue routing.

## Resume rules

- Work in repository root, not parent workspace.
- Preserve user changes. Do not reset, clean, stash, or checkout over them.
- Do not read `.env` or print credentials.
- Use disposable local Supabase for reset, integration, pgTAP, seed, and E2E.
- Preserve legacy readers; keep production flags at documented state.
- Canonical contract: `docs/product/PRD_FULL_LensaDiri.md` v2.0. Current evidence: `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md` and `docs/deployment/MODULAR_RELEASE_READINESS.md`.

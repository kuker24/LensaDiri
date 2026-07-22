# Project Handoff

> Refreshed 2026-07-22 for observability task branch. Supersedes stale `phase-1-foundation`/PR #3 snapshot.

## Current objective

Complete production-readiness tasks sequentially without unapproved production action. Current slice: structured safe observability, scheduled liveness, issue alert routing, and drill contract.

Do not: reapply or modify production migration `202607270001`, activate `FEATURE_COMPLEX_MODE`/`FEATURE_PROVISIONAL_PRECISION`/`FEATURE_AI_NARRATIVE`, run hosted dry-run/backup/seed/deploy/alias, change Vercel env, expose secrets, or merge without green CI.

## Current git state

- Base: `main` / `origin/main` at `90acf1b docs(release): record production postcheck evidence`.
- Active branch: `agent/observability-alerting`; uncommitted implementation pending full gates, commit, push, and PR.
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

- Added one server-only allowlisted JSON logger. Auth/session/estimate plus assessment start, answer save, and completion emit operation/status/duration without raw user data.
- Added `npm run monitor:health`: read-only exact-payload check for `/api/health`.
- Added scheduled/manual GitHub workflow. Failure deduplicates into one alert issue; recovery closes it. `drill=true` intentionally fails.
- No dependency, migration, database write, feature-flag change, Vercel configuration, deployment, or production mutation.
- Local evidence: format, lint, typecheck, build, audit PASS; unit PASS 30 files/139 tests; read-only live health PASS. Docker daemon unavailable, jadi integration/pgTAP/E2E lokal blocked dan wajib dibuktikan PR CI.
- Not yet production-verified: workflow inactive until merge to default branch; alert drill and recovery evidence absent; provider-level 5xx/latency/DB/flag alerts require operator configuration and approval.
- Rollback: revert PR or disable workflow; no data rollback.

## Release blockers

- Production content-table postcheck for the six guarded lenses still recommended (this audit confirmed selectability via public pages only).
- `FEATURE_COMPLEX_MODE` and Full Spectrum activation deferred; `full_spectrum`/`deep_self_discovery` presets stay draft.
- Provider email + mandatory verification `BLOCKED_EXTERNAL`.
- AI narrative deferred (flag OFF). Formal psychometric validation and third-party WCAG certification deferred — do not claim either.
- Observability completion requires merged workflow, scheduled PASS, alert drill issue + recovery close, named owner, and approved Vercel/Supabase destinations. Merge may deploy production; explicit approval required.

## Resume rules

- Work in repository root, not parent workspace.
- Preserve user changes. Do not reset, clean, stash, or checkout over them.
- Do not read `.env` or print credentials.
- Use disposable local Supabase for reset, integration, pgTAP, seed, and E2E.
- Preserve legacy readers; keep production flags at documented state.
- Canonical contract: `docs/product/PRD_FULL_LensaDiri.md` v2.0. Current evidence: `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md` and `docs/deployment/MODULAR_RELEASE_READINESS.md`.

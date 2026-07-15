# Project Handoff

## Current Objective

Remediate PRD v2 release blockers on `agent/phase-1-foundation` without touching production:

1. Trait Profile modular scoring provenance.
2. Full seed replay safety under published-content immutability.
3. Safe public shared-result projection.
4. Full disposable-local verification, clean-reset loops, GitHub Actions, audit delta, and release evidence.

Do not merge PR #3, run hosted dry-run, migrate/deploy/reset production, change production flags, expose secrets, or begin UI redesign.

## Project State

**ESTABLISHED.** Baseline MVP production remains active. Modular PRD v2 remediation source exists locally but is uncommitted and not release-certified.

```text
Branch:            agent/phase-1-foundation
Last committed SHA: 679d54ef2cadfd122a31efea5ec8c6548bee9b3a
PR:                https://github.com/kuker24/LensaDiri/pull/3
PR state:          OPEN, unmerged
```

Baseline candidate is `679d54e`. Remediation source is committed as `f8c1c3c`, `65f934b`, `e400834`, and `b3f86f6`; this documentation update and branch push remain pending. Full local gates and three clean-reset loops pass. Canonical seed drift gate also passes: intentional local metadata drift exits `1`, restoration succeeds, and post-restore replay passes. GitHub Actions remains pending after push.

## Completed

- P0-A implementation now separates legacy and modular Trait provenance:
  - Legacy `trait_profile/mvp-1` and `trait-profile-mvp-1` remain for Quick/Standard compatibility.
  - Additive `trait_profile/modular-1` carries `trait-profile-modular-1` and copied original 60-item/40-Quick content.
  - Catalog/composer choose modular Trait provenance for new modular sessions.
  - Scoring registry dispatches by module key plus expected scoring version and fails closed for unknown/mismatched versions.
  - Immutable blueprint and persisted module result provenance include module, scoring, item-bank, composer, report, and evidence data.
- P0-B implementation now scopes each seed to owned module/version content. Published-content immutability remains enabled.
- `npm run test:seed-replay` replays configured seeds twice, checks duplicates/counts/feature flags, and verifies canonical SHA-256 stability: modules `10`, module_versions `5`, dimensions `27`, questions/translations/mappings `258`, combo_presets `6`, combo_mappings `27`, SHA-256 `b0168c9e675fb453f11e6227613b90ff2f710d69d3a44f42a4e8e857ea1fe75b`.
- CI workflow has a seed replay step after pgTAP.
- P1 implementation has separate `PrivateResultView`, `SafeSharedResultView`, and `ExportResultView` contracts. `toSafeSharedResultView()` is explicit allowlist projection; shared page consumes only safe DTO.
- Shared reads fail closed for inactive, expired, revoked, deleted, or unsupported-scope shares.
- Full disposable-local verification PASS:
  - `npm ci`; lockfile unchanged.
  - format, lint, typecheck, build with disposable test-only environment, and audit `0 vulnerabilities`.
  - unit `13 files / 53 tests`.
  - DB reset, seed replay, integration `5 files / 21 tests`, pgTAP `206`, and E2E `12/12` desktop Chrome + Pixel 5.
  - Three exact clean-reset loops with matching seed hash.
  - Scoped concrete-secret scan `0` and `git diff --check` PASS.
- Local Supabase stopped after loops. Production remains untouched.

## Changed Files

### Remediation implementation committed locally

- `supabase/seed/20260716_trait_profile_modular.sql` — additive modular Trait Profile version and copied immutable content.
- `supabase/migrations/202607160001_result_module_provenance.sql` — additive item-bank/composer provenance columns.
- `supabase/seed/20260713_mvp_item_bank.sql`, `supabase/seed/20260714_modular_catalog.sql`, `supabase/seed/20260715_independent_core_modules.sql` — owned, replay-safe seed behavior.
- `scripts/test-seed-replay.mjs`, `scripts/test-seed-replay-drift.mjs`, `package.json`, `.github/workflows/ci.yml` — two-pass replay, pinned canonical identity, negative local-drift proof, and CI coverage.
- `src/lib/scoring/modules/registry.ts`, composer/blueprint/assessment repository code, validation/client/result routes — immutable version-aware Trait completion and result provenance.
- `src/server/repositories/result-views.ts`, shared route/loader/report, export route — private/shared/export DTO separation and allowlist projection.
- Unit/integration/pgTAP coverage — Trait single/combo provenance, scoring-version rejection, seed replay, and shared-result security behavior.

### Documentation pending commit

- `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md` — current PRD status matrix, remediation evidence, and release blockers; untracked until final docs commit.
- `.pi/HANDOFF.md`, `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `tests/AGENTS.md` — remediation contracts and resume guidance.
- `.pi/EVIDENCE.md` — baseline evidence plus remediation status from executed commands.

## Verification

| Command or check                              | Result                                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `npm ci`                                      | PASS — lockfile unchanged                                           |
| format, lint, typecheck                       | PASS                                                                |
| unit                                          | PASS — `13 files / 53 tests`                                        |
| build                                         | PASS — disposable test-only environment only                        |
| audit                                         | PASS — `0 vulnerabilities`                                          |
| DB reset and seed replay                      | PASS — local only; stable count/hash recorded above                 |
| `npm run test:seed-replay-drift`              | PASS — intentional mismatch exits `1`; restoration plus replay PASS |
| integration                                   | PASS — `5 files / 21 tests`                                         |
| pgTAP                                         | PASS — `206` assertions                                             |
| E2E                                           | PASS — `12/12`: 6 desktop Chrome + 6 Pixel 5                        |
| three clean-reset loops                       | PASS — reset/replay/integration/pgTAP/E2E each loop, stable hash    |
| scoped concrete-secret scan and diff check    | PASS — zero concrete credential findings                            |
| GitHub Actions for remediation source         | PENDING — post-push follow-up run must cover canonical drift gate   |
| Production reset/migration/deploy/flag change | SKIPPED — explicitly prohibited                                     |

## Current Blockers

1. **Release verification blocker.** P0/P1 local gates, three loops, and canonical-drift proof pass; documentation update, branch push, and GitHub Actions remain. Do not treat local evidence as merge approval.
2. **Release evidence blocker.** `docs/deployment/PRODUCTION_MIGRATION_MAP.md` needs modular migration checksums, dependencies, backfill/lock risk, forward-fix reservation, backup checkpoint, rollback threshold, and post-migration verification before hosted dry-run.
3. **PRD partial scope.** Published presets, Full Spectrum, Complex/multi-segment proof, full clarifier E2E, active-session dashboard, public catalog/supporting routes, optional consent/retention workflow, admin publication, six additional module engines, formal WCAG, operations readiness, and psychometric validation remain incomplete or deferred.
4. **Vercel Preview topology.** Preview lacks production-only environment values. Do not copy production secrets to Preview. This is not a GitHub Actions release-gate substitute.

## Next Steps

1. Preserve current dirty worktree. Do not reset, checkout, stash, or delete source/test/docs changes.
2. Stage this documentation update with explicit paths; never use `git add -A`.
3. Push `agent/phase-1-foundation`; require GitHub `Quality and build` and `Database and browser tests` PASS, including replay, canonical-drift, and Playwright gates.
4. Update modular migration release evidence and audit delta. Keep PR #3 open until separate approval.

## Resume Instructions

1. Work in `LensaDiri/`, not parent workspace. Run `git status --short`, `git branch --show-current`, and inspect source changes before editing.
2. Read root `AGENTS.md`, `src/AGENTS.md`, `supabase/AGENTS.md`, `tests/AGENTS.md`, canonical PRD, this handoff, and `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md`.
3. Do not read `.env` or credential files. Use only disposable local Supabase for destructive commands.
4. Treat P0-A/P0-B/P1 implementation as locally complete with full disposable gates, loops, and canonical-drift proof, but not release-complete until GitHub Actions and migration release evidence pass.
5. Before production action, require completed local gates, committed/pushed source, GitHub Actions evidence, updated release map, non-destructive dry-run, backup/forward-fix decision, and explicit user approval.

## User Notes

- Canonical product contract: `docs/product/PRD_FULL_LensaDiri.md` v2.0.
- Legacy Quick 40/Standard 60 and legacy result reads must remain compatible.
- Published versions/content and used blueprints stay immutable. Revision uses additive versions and fix-forward migrations.
- Public shared results must use explicit safe projection; private diagnostics remain private.
- Incomplete modules remain hidden/disabled and must not be derived from Trait Profile.
- No production reset, migration, deploy, feature-flag change, secret exposure, PR merge, or design replacement is authorized in this remediation phase.

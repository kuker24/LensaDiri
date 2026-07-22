# Production Migration Map

## Production database

- Platform: Supabase hosted PostgreSQL
- Region: Southeast Asia (Singapore)
- Environment topology: one hobby production project; no staging project
- Release policy: additive migration-only; never run reset or destructive test suites against production

Production project identifiers, database URLs, passwords, API keys, and connection-pool credentials are intentionally excluded from repository files.

## Applied migration mapping

Verified with `supabase migration list --linked` on 2026-07-22. Production contains versions `202607120001` through `202607270001`; local and hosted migration history agree through `202607270001`. An earlier revision of this document described `202607270001` as pending on `202607200002`; that statement is superseded by the current linked migration list, which shows `202607270001` present on both Local and Remote.

| Version        | Repository source                                                    | SHA-256                                                            | Production status | Purpose                                                                             |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------- |
| `202607120001` | `supabase/migrations/202607120001_phase_1_foundation.sql`            | `b075bc62db2c676272ecb3469c1b3912367038a9b4cb8b94768690fbb24c03b9` | Applied           | Accounts, sessions, consent, rate limit, audit, forced RLS, browser-role revocation |
| `202607130001` | `supabase/migrations/202607130001_account_hard_delete.sql`           | `bca0fdcb14c1bafac0c98d19d0292278dd2cfd731fc943ccaad36a433acdb003` | Applied           | Trusted account erasure and account-delete rate limit                               |
| `202607130002` | `supabase/migrations/202607130002_mvp_assessment.sql`                | `38a4578dc0f86792a67901aa356a680a6aa66a9e2ed20690b5235d476655f9e3` | Applied           | Legacy question bank, assessment, result, share, and forced-RLS schema              |
| `202607130003` | `supabase/migrations/202607130003_mvp_feedback.sql`                  | `4fce3896854ca161c37af0e49ba1fcb197760aa94965a5ab304bf310ed56b3d8` | Applied           | Server-only result feedback                                                         |
| `202607130004` | `supabase/migrations/202607130004_portable_email_constraint.sql`     | `371bd1719b6ba02d3efe93b489f7e1a8c58fdc00ef2458039d089817d29c3b08` | Applied           | Portable hosted/local email constraint                                              |
| `202607130005` | `supabase/migrations/202607130005_modular_enum_extensions.sql`       | `b28deeba68f92e221ddc37950144ca48fdeb311552e3c863976d2b191c12d166` | Applied           | Modular enum extensions                                                             |
| `202607130006` | `supabase/migrations/202607130006_modular_assessment_foundation.sql` | `f8a781e63d5c734388ec91482dd536473cc2e7c90113f2e103b4173e0f0b19c6` | Applied           | Modular assessment foundation and legacy result-version backfill                    |
| `202607150001` | `supabase/migrations/202607150001_modular_clarifier_runtime.sql`     | `6f567d1170305563b06b3016d831b8faca95f09c1fbd49989f59ad853cc7ef65` | Applied           | Clarifier runtime schema                                                            |
| `202607160001` | `supabase/migrations/202607160001_result_module_provenance.sql`      | `60b33f6e61692bccce988b46a1d69db8ba86ece5f063d130c55cf264ecde06c2` | Applied           | Result module provenance                                                            |
| `202607160002` | `supabase/migrations/202607160002_prd_v2_release_contract.sql`       | `2e75f373717a37b18e76394841d4572be344cb2c6bfb059286e21334f61244eb` | Applied           | PRD v2 release and publication contract                                             |
| `202607160003` | `supabase/migrations/202607160003_dashboard_audit_extension.sql`     | `f6e167e4ffc264e563c3bacfbd7097cb888fa41658932e45133acc68e6b73980` | Applied           | Canonical audit constraint normalization                                            |
| `202607200001` | `supabase/migrations/202607200001_account_recovery_foundation.sql`   | `bd2060b4b1c5457e24eee5bb77edc44ffc3a9677b293885ebb6a59211436400d` | Applied           | Dormant account recovery foundation                                                 |
| `202607200002` | `supabase/migrations/202607200002_quality_model_version.sql`         | `73f84030fbbdbdbfda60bc14e240689acb7d497530d8589893697a14d7775eef` | Applied           | Versioned quality-model provenance on `assessment_blueprints`                       |
| `202607270001` | `supabase/migrations/202607270001_guarded_all_lenses_release.sql`    | `dc3736fbd39d14f687520a4530e5477b8d1a2d2ec6ca70dd32731d8d647725f4` | Applied           | Promote 6 deferred modules to selectable guarded beta/experimental                  |

Production checkpoint: 14 migrations applied through `202607270001`, `FEATURE_MODULAR_COMPOSER` enabled, all checked tables forced RLS, legacy Quick 40/Standard 60 intact. The guarded six-lens rollout (`202607270001`) is now applied; all 10 modules are selectable in production.

## Applied guarded-lens migration

| Version        | Repository source                                                 | SHA-256                                                            | Production status | Purpose                                                            |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------ |
| `202607270001` | `supabase/migrations/202607270001_guarded_all_lenses_release.sql` | `dc3736fbd39d14f687520a4530e5477b8d1a2d2ec6ca70dd32731d8d647725f4` | Applied           | Promote 6 deferred modules to selectable guarded beta/experimental |

Details:

- Dependency: required `202607200002` and preexisting modular content seeded.
- Effect: Promoted Three Center, Instinct, RIASEC, and Attachment to pilot selectable status, and Socionics and Psychosophy to experimental selectable status, using `guardedBeta=true` config flags.
- Merged to `main` via PR #15 (merge `9ff30cf`, 2026-07-19) and applied to production (confirmed in linked migration list, 2026-07-22).
- Open read-only postcheck against production content tables remains recommended: confirm the six modules are selectable with correct `pilot`/`experimental` status, items/translations stay `review_status='draft'`, and `guardedBeta=true` only on the six target versions. This audit verified selectability via public pages, not direct content-table queries.

### Postcheck for a future approved apply

```sql
select key, status, is_selectable, release_disposition
from public.modules
where key in ('three_center', 'instinct', 'socionics_communication', 'riasec', 'attachment', 'psychosophy')
order by key;
```

A future approved migration window must verify:

- Three Center, Instinct, RIASEC, Attachment are selectable and have status `pilot`;
- Socionics and Psychosophy are selectable and have status `experimental`;
- None of these modules has status `draft` or release disposition `DEFERRED_WITH_REASON`;
- Items and translations remain `draft` review status (no formal review bypassed);
- Legacy Quick 40 and Standard 60 session and result readers still pass smoke checks.

This migration is applied to production; the linked migration list on 2026-07-22 shows `202607270001` on both Local and Remote. The postcheck query above remains valid as a read-only verification to run directly against production content tables.

## Applied additive chain

Versions below were applied on 2026-07-17 after logical backup, aggregate preflight, checksum review, and a seven-migration dry-run. They are now immutable production history. Future changes require additive fix-forward migrations.

| Version        | Repository source                                | SHA-256                                                            | Dependency and effect                                                                                                                                      | Backfill and compatibility                                                                                    | Lock and fix-forward risk                                                                                                      |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `202607130005` | `202607130005_modular_enum_extensions.sql`       | `b28deeba68f92e221ddc37950144ca48fdeb311552e3c863976d2b191c12d166` | Depends on baseline enums. Adds modular role, evidence, category, mode, status, and audit labels.                                                          | No row backfill. Legacy values remain valid.                                                                  | PostgreSQL enum additions are practically irreversible. Stop on any enum/history mismatch and use additive fix-forward.        |
| `202607130006` | `202607130006_modular_assessment_foundation.sql` | `f8a781e63d5c734388ec91482dd536473cc2e7c90113f2e103b4173e0f0b19c6` | Depends on `130005` and legacy assessment. Adds catalog, immutable blueprint, segmented session, modular result/correlation, clarifier, and feature flags. | Backfills translations, mappings, and one `result_versions` row per existing legacy result.                   | Largest DDL/data step. Replaces rate-limit and audit CHECK constraints. Apply alone and verify before continuing.              |
| `202607150001` | `202607150001_modular_clarifier_runtime.sql`     | `6f567d1170305563b06b3016d831b8faca95f09c1fbd49989f59ad853cc7ef65` | Depends on modular clarifier/result tables. Adds server-only clarifier item and answer tables with forced RLS.                                             | No backfill. Existing results remain readable.                                                                | Metadata locks for table/index creation. Stop if RLS, policies, or grants differ.                                              |
| `202607160001` | `202607160001_result_module_provenance.sql`      | `60b33f6e61692bccce988b46a1d69db8ba86ece5f063d130c55cf264ecde06c2` | Depends on `result_modules`. Adds nullable item-bank and composer provenance columns and constraints.                                                      | No immediate backfill. Legacy and earlier modular rows may remain null. New writes populate both.             | Short table-alter lock expected. Preserve nullable read compatibility.                                                         |
| `202607160002` | `202607160002_prd_v2_release_contract.sql`       | `2e75f373717a37b18e76394841d4572be344cb2c6bfb059286e21334f61244eb` | Adds release disposition, privacy/publication tables, trusted publication/CAS/cleanup functions, forced RLS, and revokes.                                  | Existing modules receive release defaults. Canonical seed remains a separate, unauthorized production action. | Alters `modules`, validates constraints, and installs security-definer functions. Review grants and invariants before proceed. |
| `202607160003` | `202607160003_dashboard_audit_extension.sql`     | `f6e167e4ffc264e563c3bacfbd7097cb888fa41658932e45133acc68e6b73980` | Normalizes both audit CHECK constraints to the complete taxonomy introduced by `202607130006`.                                                             | No row backfill. Existing audit values are validated against the canonical taxonomy.                          | Replaces and validates two CHECK constraints so candidate upgrades and clean resets converge.                                  |
| `202607200001` | `202607200001_account_recovery_foundation.sql`   | `bd2060b4b1c5457e24eee5bb77edc44ffc3a9677b293885ebb6a59211436400d` | Depends on accounts, sessions, rate limits, and audit logs. Adds hash-only recovery tokens and extends route/action constraints.                           | No user backfill. Provider email remains production-disabled and login verification remains unenforced.       | Creates table/indexes and replaces two CHECK constraints. Treat as dormant foundation until provider/product approval.         |

Checksums describe the candidate after local recovery lifecycle fixes. Recalculate and update this map whenever a pending migration changes. Once a version is applied remotely, never rewrite it.

## Seed mapping

`supabase/config.toml` is the source of seed order. Configured seeds own explicit module/version content, are replayed twice by `npm run test:seed-replay`, and must keep every feature flag false. Published content is insert-once and immutable. No seed contains an account, password, token, credential, production identifier, user record, or production export.

Production seed application is not authorized in this release phase. A future release must compare expected reviewed counts and canonical SHA-256 from a clean local reset before any hosted seed action.

## Production migration evidence

Executed on 2026-07-17 against the verified Singapore production project:

1. Linked history contained only `202607120001` through `202607130004` before rollout.
2. Provider physical backup/PITR was unavailable. A permission-restricted logical schema/data/roles backup was created outside the repository and its SHA-256 manifest verified. Restore drill remains blocked without an isolated project.
3. Aggregate preflight found zero active legacy results, 60 active questions, 40 Quick questions, no `feature_flags` table yet, and one compatible audit aggregate value.
4. `supabase db push --linked --dry-run` reported exactly the seven reviewed versions.
5. `supabase db push --linked` applied all seven versions successfully. Linked history now matches all 12 repository migrations.
6. Postchecks found zero RLS, browser-grant, result-version, deferred-selectability, combo-ownership, or enabled-feature-flag violations. Legacy `trait_profile/mvp-1` remains intentionally `active`, not `published`.
7. Vercel production deployment `dpl_C5miY5hwXuz68fmP7JESVbvqrhBm` built merge SHA `814f467a67e5fd01d03ba7010cf2ace6e7c2ec12`, reached `Ready`, and serves the stable alias.
8. `/api/health` returned HTTP 200 with only `{"status":"ok"}`. Public routes, DB-backed module/combo routes, dashboard guest redirect, legacy 60/40 counts, and security headers passed non-destructive smoke checks.

## Read-only post-migration verification contract

A future approved migration window must verify after each step without returning user data:

- expected migration version exists exactly once;
- all sensitive new tables have RLS enabled and forced;
- browser policies remain zero and `anon`/`authenticated` direct privileges remain zero;
- all feature flags remain false;
- one `result_versions` row exists per preexisting non-deleted legacy result after the foundation backfill;
- no combo pin crosses module ownership;
- published content and used blueprints reject mutation;
- legacy Quick 40/Standard 60 session and result readers still pass smoke checks;
- `/api/health` remains liveness-only and does not count as DB readiness proof.

Stop before the next migration when any assertion fails. Database rollback is additive fix-forward only. Application rollback may promote the prior Vercel deployment, but it does not undo schema changes.

## Local reproduction

Disposable local verification only:

```bash
npm run db:start
npm run db:reset
npm run test:seed-replay
npm run test:seed-replay-drift
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
npm run test:e2e
```

Never run reset, integration, pgTAP, seed replay/drift/parity, or E2E against hosted production.

## Release boundary

Approved migration and modular content activation through `202607270001` are completed in production. Production currently has `FEATURE_MODULAR_COMPOSER` ON, all 10 modules selectable (six under guarded beta/experimental), while Complex, provisional precision, and AI narrative remain OFF. Recovery remains dormant until provider email and mandatory verification are approved.

The guarded six-lens rollout (`202607270001`) reached `main` via PR #15 and is applied to production. Remaining production actions (Complex mode, provisional precision, AI narrative, provider email, mandatory verification) still require separate approved windows.

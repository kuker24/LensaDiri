# Production Migration Map

## Production database

- Platform: Supabase hosted PostgreSQL
- Region: Southeast Asia (Singapore)
- Environment topology: one hobby production project; no staging project
- Release policy: additive migration-only; never run reset or destructive test suites against production

Production project identifiers, database URLs, passwords, API keys, and connection-pool credentials are intentionally excluded from repository files.

## Applied migration mapping

Verified read-only on 2026-07-16 with `supabase migration list`. Production contains only versions `202607120001` through `202607130004`. Local names and hosted migration history agree.

| Version        | Repository source                                                | SHA-256                                                            | Production status | Purpose                                                                             |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- | ----------------------------------------------------------------------------------- |
| `202607120001` | `supabase/migrations/202607120001_phase_1_foundation.sql`        | `b075bc62db2c676272ecb3469c1b3912367038a9b4cb8b94768690fbb24c03b9` | Applied           | Accounts, sessions, consent, rate limit, audit, forced RLS, browser-role revocation |
| `202607130001` | `supabase/migrations/202607130001_account_hard_delete.sql`       | `bca0fdcb14c1bafac0c98d19d0292278dd2cfd731fc943ccaad36a433acdb003` | Applied           | Trusted account erasure and account-delete rate limit                               |
| `202607130002` | `supabase/migrations/202607130002_mvp_assessment.sql`            | `38a4578dc0f86792a67901aa356a680a6aa66a9e2ed20690b5235d476655f9e3` | Applied           | Legacy question bank, assessment, result, share, and forced-RLS schema              |
| `202607130003` | `supabase/migrations/202607130003_mvp_feedback.sql`              | `4fce3896854ca161c37af0e49ba1fcb197760aa94965a5ab304bf310ed56b3d8` | Applied           | Server-only result feedback                                                         |
| `202607130004` | `supabase/migrations/202607130004_portable_email_constraint.sql` | `371bd1719b6ba02d3efe93b489f7e1a8c58fdc00ef2458039d089817d29c3b08` | Applied           | Portable hosted/local email constraint                                              |

Last recorded production smoke baseline: 5 migrations, 15 forced-RLS tables, zero browser policies, 60 seeded Standard questions, and 40 Quick questions. These counts describe the legacy production checkpoint, not the modular candidate.

## Pending additive chain

Versions below are local-only as of the read-only check above. The seven repository files are the canonical pending chain. Because none are hosted, they remain pending. Do not rename or apply them without a reviewed release decision.

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

## Required preflight before hosted dry-run

These steps require separate user approval. They are not executed by local CI:

1. Confirm exact linked project and current hosted migration history.
2. Record a provider backup checkpoint or explicitly accept that the hobby topology has no proven restore drill.
3. Measure legacy `personality_results` count and local `result_versions` backfill runtime.
4. Prove zero invalid question mode-eligibility rows and zero combo ownership mismatches.
5. Run `supabase db push --linked --dry-run` and compare only the seven reviewed pending versions.
6. Stop immediately if migration order, checksum, DDL, expected row effect, RLS, policy, grant, or preflight result differs.

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

Current authorization ends at local verification, explicit commits, branch push, and GitHub Actions observation. Hosted dry-run, backup/export, migration, production seed, Vercel deployment/alias/environment changes, PR merge, and feature activation all require separate approval.

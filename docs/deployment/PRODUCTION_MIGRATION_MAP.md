# Production Migration Map

## Production database

- Platform: Supabase hosted PostgreSQL
- Region: Southeast Asia (Singapore)
- Environment topology: one hobby production project; no staging project
- Release policy: additive migration-only; never run reset or destructive test suites against production

Production project identifiers, database URLs, passwords, API keys, and connection-pool credentials are intentionally excluded from repository files.

## Applied migration mapping

Verified on 2026-07-13 using Supabase migration history and normalized statement-by-statement comparison. Local file names and SQL statements match production history.

| Version        | Repository source                                                | Production status             | Purpose                                                                                            |
| -------------- | ---------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| `202607120001` | `supabase/migrations/202607120001_phase_1_foundation.sql`        | Applied; statement match PASS | Accounts, sessions, consent, rate limit, audit, forced RLS, and browser-role revocation            |
| `202607130001` | `supabase/migrations/202607130001_account_hard_delete.sql`       | Applied; statement match PASS | Trusted account erasure and account-delete rate-limit route                                        |
| `202607130002` | `supabase/migrations/202607130002_mvp_assessment.sql`            | Applied; statement match PASS | Module registry, question bank schema, assessment, answers, result, scores, shares, and forced RLS |
| `202607130003` | `supabase/migrations/202607130003_mvp_feedback.sql`              | Applied; statement match PASS | Result feedback and server-only feedback boundary                                                  |
| `202607130004` | `supabase/migrations/202607130004_portable_email_constraint.sql` | Applied; statement match PASS | Portable hosted/local email constraint                                                             |

Production schema smoke evidence:

- migration count: 5
- forced-RLS tables: 15
- browser policies in `public`: 0
- seeded questions: 60
- Quick questions: 40

## Seed mapping

| Repository source                          | Production status   | Reproducibility                                                                            |
| ------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------ |
| `supabase/seed/20260713_mvp_item_bank.sql` | Applied             | Idempotent module/version/dimension/question upserts; 60 Standard items and 40 Quick items |
| `supabase/config.toml`                     | Source of seed path | `db.seed.sql_paths` points to item-bank seed for clean local reset                         |

Seed contains original Indonesian LensaDiri items only. It contains no account, password, token, credential, production project ID, user record, or production export.

## Reproduction workflow

Local/disposable verification:

```bash
npm run db:start
npm run db:reset
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
```

Production release:

1. Authenticate Supabase CLI locally.
2. Link intended empty or existing production project outside tracked files.
3. Run `supabase db push --linked --dry-run` and inspect exact pending versions.
4. Apply only reviewed additive migrations.
5. Apply idempotent item-bank seed only when expected.
6. Verify migration versions, forced RLS, zero browser policies, and question counts without returning user data.

Never run these against production:

```bash
npm run db:reset
npm run test:integration
npm run test:db
npm run test:e2e
```

## Rollback and mitigation

Schema migrations are additive. Prefer fix-forward migrations. Do not rewrite applied migration files, drop production tables, or reset production. Account hard delete and result deletion are runtime user actions, not migration-time data deletion.

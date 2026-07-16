# Engineering Evidence

## Objective

Reproducible release-candidate checkpoint for LensaDiri legacy compatibility, feature-flagged modular assessment, account-recovery foundation, privacy controls, additive migrations, and disposable-local verification.

## Source checkpoint

- Branch: `agent/phase-1-foundation`
- Production URL: `https://lensadiri.vercel.app`
- Pull request: `https://github.com/kuker24/LensaDiri/pull/3`
- Production remains legacy Quick 40/Standard 60. Modular migrations, deployment, and feature activation have not occurred.
- Candidate changes remain local until explicit commits and branch push complete.

Production identifiers, database URLs, access tokens, passwords, API keys, and secret values are intentionally excluded.

## Implemented candidate scope

- Legacy Quick 40/Standard 60 compatibility remains covered.
- Modular catalog/composer is default-off and hidden when `FEATURE_MODULAR_COMPOSER=false`.
- Complex and Full Spectrum are hidden when `FEATURE_COMPLEX_MODE=false`.
- Catalog and preset pins reject unsupported scoring provenance before session composition.
- Immutable blueprint, segmented lifecycle, Full Spectrum, Complex, clarifier, dashboard navigation, safe share/export/delete, and independent modular scoring are covered locally.
- Recovery foundation uses hash-only single-use tokens, explicit delivery state, expiry, concurrent-consume safety, session revocation, generic responses, CSRF, rate limits, and forced RLS. Production email transport and login verification enforcement remain disabled pending provider/product approval.
- Recovery bearer links use URL fragments rather than query strings. Test delivery remains non-production/disposable-only.
- Assessment and clarifier progress expose accessible progressbar semantics.
- Migration map records hosted history, pending checksums, dependencies, backfill, lock risk, compatibility, backup limitation, stop threshold, fix-forward, and postverify contract.

## Verification evidence

All commands below used disposable local Supabase and test-only values. No destructive or write command targeted production.

| Check                          | Current result                                                                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`         | PASS.                                                                                                                         |
| `npm run lint`                 | PASS.                                                                                                                         |
| `npm run typecheck`            | PASS.                                                                                                                         |
| `npm test`                     | PASS: 14 files, 64 tests.                                                                                                     |
| `npm run build`                | PASS with complete dummy test-only environment.                                                                               |
| `npm audit --audit-level=high` | PASS: zero vulnerabilities.                                                                                                   |
| `npm run db:reset`             | PASS against disposable local Supabase.                                                                                       |
| `npm run test:seed-replay`     | PASS: modules 10, module versions 13, dimensions 64, questions/translations/mappings 642, combo presets 6, combo mappings 25. |
| Canonical seed SHA-256         | `c3d01263dc56ad7f6434fe7af99d1e6b934e82182aed2c6c2539d5818a4b69f0`.                                                           |
| Seed drift gate                | PASS: intentional drift rejected, restored, replay passed.                                                                    |
| Seed upgrade parity            | PASS: prior checkpoint identity matched canonical.                                                                            |
| `npm run test:integration`     | PASS: 8 files, 46 tests.                                                                                                      |
| `npm run test:db`              | PASS: 237 assertions.                                                                                                         |
| `npm run test:e2e`             | PASS: 22 tests, 11 desktop Chromium and 11 Pixel 5.                                                                           |
| Three clean-reset loops        | PASS: each reset, replay, drift, parity, integration 46, pgTAP 237, and E2E 22 with identical canonical hash.                 |
| `git diff --check`             | PASS before documentation refresh.                                                                                            |
| GitHub Actions                 | PENDING until candidate commits are pushed.                                                                                   |

Initial E2E loop attempts exposed shared test rate-limit state and missing autosave synchronization. Test-only rate-limit guards now require non-production, recovery test transport, and disposable `TEST_DATABASE_URL`. Browser tests now wait for persisted answer counts before completion. Three final loops passed without retry-only success.

## Production evidence

Read-only checks only:

- Vercel CLI authentication available and local project link present.
- Public deployment and `/api/health` responded successfully.
- Hosted Supabase project reported active healthy.
- `supabase migration list` showed only versions `202607120001` through `202607130004` applied remotely.
- Versions `202607130005` through `202607200001` remain local-only.
- No hosted dry-run, backup/export, migration, seed, deploy, alias, environment, merge, or feature-flag action occurred.

## Residual risks and deferred scope

- GitHub Actions must pass on pushed candidate SHA before merge consideration.
- Production migration requires separate approval, non-destructive dry-run, backup capability/limitation decision, and per-step postverify.
- Provider email delivery and mandatory verification remain `BLOCKED_EXTERNAL`.
- Formal psychometric validation, third-party WCAG certification, AI narrative, monitoring provider, restore drill, staging, custom domain, admin publication UI, retention automation, optional consent expansion, public catalog/legal/blog routes, and complete long-form growth report remain deferred or partial.
- Feature flags remain OFF in production.
- Never run local reset, integration, pgTAP, seed, or E2E suites against production.

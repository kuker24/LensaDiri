# Tests Agent Guide

## Purpose

`tests/` verifies public behavior, auth/account deletion, legacy and modular assessment/result contracts, scoring provenance, composer/clarifier/correlation behavior, database default-deny rules, and desktop/mobile browser flows.

## Ownership

- `unit/`: Vitest tests for legacy/modular scoring, version-aware registry dispatch, composer, catalog/estimate, clarifier/correlation, safe shared/export DTO projection, token, auth/session, CSRF, rate limit, environment, and strict request validation.
- `integration/`: Real disposable PostgreSQL/Supabase tests for auth/account erasure, legacy Quick/Standard lifecycle, Trait modular Quick/Normal/combo completion, immutable provenance, correlation, clarifier, safe share/export/delete, and feature-flag rollback.
- `e2e/`: Serial Playwright desktop Chrome/Pixel 5 tests for public/auth/account, legacy assessment/result controls, and modular selection/start/pause/resume/completion/report flow.
- `../supabase/tests/`: pgTAP test scripts for migration schema, RLS forced state, browser-role privileges, constraints, indexes, triggers, and foreign-key delete behavior.

## Local Contracts

- Keep tests deterministic and independent of production credentials, `.env` contents, and network-only state. Browser lifecycle specs intentionally share one disposable DB, so Playwright runs with `workers: 1`; never rely on cross-test residue.
- Integration tests must use a disposable local database identified by `TEST_DATABASE_URL`. Never point them at shared, staging, or production databases.
- Test security behavior without logging secrets, raw token values, raw answers, private result data, passwords, raw IPs, or raw user-agent strings.
- Unit coverage verifies Likert/profile scoring, overlay determinism, input boundaries, token generation/HMAC, email/password/session, CSRF, rate limit, request schemas, and environment validation.
- Integration coverage requires migrations and seed applied from clean local database. It verifies auth, hard delete, Quick/Standard assessment, result, feedback, and share persistence rather than mocks.
- pgTAP database tests must retain default-deny expectations: RLS enabled and forced; no policies; no `SELECT`, `INSERT`, `UPDATE`, or `DELETE` privilege for `anon` and `authenticated` on sensitive tables.
- Add explicit regression coverage for Likert range boundaries and security-sensitive behavior when related code changes. Source use of `timingSafeEqual` is not evidence of timing-characteristic test coverage.
- Modular work must cover immutable blueprint/version selection, expected scoring-version dispatch, independent per-module completion, legacy Quick/Standard result reading, feature-flag rollback, safe shared DTO projection, and full seed replay.
- Trait provenance remediation requires Quick/Normal single completion, Trait+16-Type and Trait+Enneagram combos, retry identity, persisted blueprint/result provenance, legacy compatibility, and unknown-version rejection. Registry tests must dispatch by module key plus scoring version and fail closed.
- Public share tests must prove private diagnostics exist only in `PrivateResultView`; `SafeSharedResultView` must omit IDs, raw scores, quality/confidence diagnostics, timing, clarifier data, feedback, audit data, scoring configuration, and token hashes. Cover revoked, expired, deleted, and unsupported-scope rejection.
- Do not weaken assertions or skip tests to make checks pass.

## Work Guidance

1. Place pure domain and request-boundary tests in `unit/`.
2. Place persistence behavior requiring PostgreSQL in `integration/`; start local Supabase, reset migrations, and set `TEST_DATABASE_URL` before running it.
3. Put schema/RLS/grant assertions in `supabase/tests/` using pgTAP.
4. Place browser-visible public or authenticated flow checks in `e2e/` and use accessible Playwright locators.
5. Add regression coverage with bug fixes and behavior changes.

## Verification

```bash
npm test
npm run db:reset
npm run test:seed-replay
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
npm run test:e2e
```

After remediation, run full gates and three clean-reset loops before release evidence. Targeted local evidence does not replace those gates.

`db:reset`, `test:integration`, and `test:db` require Docker-backed local Supabase. They passed at MVP checkpoint on 2026-07-13; rerun after DB, auth, repository, scoring, or assessment changes. Never substitute static SQL review for runtime evidence.

GitHub Actions runs two gates: `Quality and build` performs clean install, format, lint, typecheck, unit, build, and dependency audit; `Database and browser tests` starts/resets disposable Supabase, runs integration, pgTAP, and seed replay, resets again, then runs serial desktop/Pixel 5 Playwright. Workflow values are dummy test-only values, never production credentials.

Run root formatting, lint, typecheck, test, audit, and build gates before PR.

## Child DOX Index

No child DOX. `unit/`, `integration/`, and `e2e/` are test areas covered here; pgTAP ownership is documented at `supabase/AGENTS.md`.

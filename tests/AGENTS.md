# Tests Agent Guide

## Purpose

`tests/` verifies Phase 0 public behavior and Phase 1 trusted auth/database contracts through deterministic unit tests, real-PostgreSQL integration tests, and public browser smoke tests.

## Ownership

- `unit/`: Vitest tests for Likert, token, auth, password/session behavior, CSRF, rate limit, environment validation, and request validation.
- `integration/`: Vitest suite using a real local PostgreSQL/Supabase database. `setup.ts` requires `TEST_DATABASE_URL`, then defines test-only runtime environment values. `phase-1-foundation.test.ts` covers schema presence, RLS/policy state, account/session lifecycle, consent, rate limit, duplicate registration, login, expiry, and logout.
- `e2e/`: Playwright smoke tests for public landing and information routes. Auth browser flow does not yet have E2E coverage.
- `../supabase/tests/`: pgTAP test scripts for migration schema, RLS forced state, browser-role privileges, constraints, indexes, triggers, and foreign-key delete behavior.

## Local Contracts

- Keep tests deterministic and independent of production credentials, `.env` contents, network-only state, and test order.
- Integration tests must use a disposable local database identified by `TEST_DATABASE_URL`. Never point them at shared, staging, or production databases.
- Test security behavior without logging secrets, raw token values, raw answers, private result data, passwords, raw IPs, or raw user-agent strings.
- Unit coverage verifies Likert scoring, reverse scoring, normalization, input and weight validation, token generation, HMAC hashing, invalid-token handling, email normalization, password hashing, session lifecycle helpers, CSRF, rate limits, request schemas, and environment validation.
- Integration coverage requires migration applied from a clean local database. It verifies Phase 1 persistence rather than mock repository behavior.
- pgTAP database tests must retain default-deny expectations: RLS enabled and forced; no policies; no `SELECT`, `INSERT`, `UPDATE`, or `DELETE` privilege for `anon` and `authenticated` on sensitive tables.
- Add explicit regression coverage for Likert range boundaries and security-sensitive behavior when related code changes. Source use of `timingSafeEqual` is not evidence of timing-characteristic test coverage.
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
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
npm run test:e2e
```

`db:reset`, `test:integration`, and `test:db` require Docker-backed local Supabase. Current evidence records these DB gates as blocked until that environment is available; do not report them as passing from unit tests or static SQL review.

Run root formatting, lint, typecheck, test, audit, and build gates before PR.

## Child DOX Index

No child DOX. `unit/`, `integration/`, and `e2e/` are test areas covered here; pgTAP ownership is documented at `supabase/AGENTS.md`.

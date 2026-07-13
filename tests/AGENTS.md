# Tests Agent Guide

## Purpose

`tests/` verifies public behavior, auth/account deletion, and MVP assessment/result contracts through deterministic unit tests, real-PostgreSQL integration tests, pgTAP, and desktop/mobile browser flows.

## Ownership

- `unit/`: Vitest tests for Likert/profile scoring, overlay determinism, token, auth, password/session, CSRF, rate limit, environment, and strict request validation.
- `integration/`: Real local PostgreSQL/Supabase tests. `phase-1-foundation.test.ts` covers auth/account erasure; `mvp-assessment.test.ts` covers Quick/Standard session, answers, atomic completion, result, feedback, share/revoke, and delete.
- `e2e/`: Playwright desktop/Pixel 5 tests for public pages, auth/account deletion, Quick assessment, autosave/resume, overlays, feedback, result, share/revoke, export, and delete.
- `../supabase/tests/`: pgTAP test scripts for migration schema, RLS forced state, browser-role privileges, constraints, indexes, triggers, and foreign-key delete behavior.

## Local Contracts

- Keep tests deterministic and independent of production credentials, `.env` contents, network-only state, and test order.
- Integration tests must use a disposable local database identified by `TEST_DATABASE_URL`. Never point them at shared, staging, or production databases.
- Test security behavior without logging secrets, raw token values, raw answers, private result data, passwords, raw IPs, or raw user-agent strings.
- Unit coverage verifies Likert/profile scoring, overlay determinism, input boundaries, token generation/HMAC, email/password/session, CSRF, rate limit, request schemas, and environment validation.
- Integration coverage requires migrations and seed applied from clean local database. It verifies auth, hard delete, Quick/Standard assessment, result, feedback, and share persistence rather than mocks.
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

`db:reset`, `test:integration`, and `test:db` require Docker-backed local Supabase. They passed at MVP checkpoint on 2026-07-13; rerun after DB, auth, repository, scoring, or assessment changes. Never substitute static SQL review for runtime evidence.

Run root formatting, lint, typecheck, test, audit, and build gates before PR.

## Child DOX Index

No child DOX. `unit/`, `integration/`, and `e2e/` are test areas covered here; pgTAP ownership is documented at `supabase/AGENTS.md`.

# Engineering Evidence

## Objective

Implement Phase 1 trusted application foundation: internal authentication, DB boundary, CSRF, rate limiting, consent persistence, and tests.

## Scope

- Server-only PostgreSQL driver and lazy environment validation.
- Typed repositories and auth, consent, and fixed-window rate-limit services.
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, and `/api/auth/session`.
- Unit tests plus real-PostgreSQL integration suite configuration.

## Skills Used

- `fable-auto`
- `senior-engineer-auto`
- `astral-database-design`
- `astral-full-security`
- `astral-full-test`
- `astral-lint-and-validate`

## Files Changed

- `package.json`, `package-lock.json`
- `src/app/api/auth/**`
- `src/lib/auth/**`, `src/lib/db/**`, `src/lib/security/{csrf,http,rate-limit}.ts`, `src/lib/validation/auth.ts`
- `src/server/**`
- `tests/unit/{auth,csrf,environment,rate-limit,request-validation}.test.ts`
- `tests/integration/**`, `vitest.integration.config.ts`

## Commands Run

- `npm install postgres argon2 server-only`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit --audit-level=high`
- `npm run test:e2e`
- `npm run test:integration`
- `npm run db:reset`
- `git diff --check`

## Results

- Lint: PASS.
- Typecheck: PASS.
- Unit test: PASS, 7 files and 21 tests.
- Build without runtime secrets: PASS.
- Audit: PASS, 0 vulnerabilities.
- E2E: PASS after installing required local Chromium; 4 Chromium/mobile smoke tests passed.
- Changed-file Prettier check: PASS.
- Full `npm run format:check`: FAIL on pre-existing formatting in public pages, styles, and PRD. Changed files are formatted.
- `git diff --check`: PASS.

## Verification Status

- Database integration tests: BLOCKED. `TEST_DATABASE_URL` intentionally required; no local database started.
- Supabase reset: BLOCKED. Docker daemon unavailable: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
- pgTAP RLS test: BLOCKED. `npx supabase test db` cannot connect to local PostgreSQL because no Docker-backed Supabase database is running.

## Remaining Risks

- Apply migration and run `npm run test:db` plus `TEST_DATABASE_URL=<local trusted URL> npm run test:integration` after Docker/Supabase local environment is available.
- Full repository Prettier baseline remains nonconformant outside Phase 1 scope.

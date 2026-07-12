# Engineering Evidence

## Objective

Phase 1 trusted application foundation: internal auth, PostgreSQL server boundary, database schema/RLS, CSRF, rate limit, consent persistence, and tests.

## Environment evidence

- Node.js: `v24.18.0`
- npm: `11.16.0`
- Supabase CLI: `2.109.1` through `npx supabase`
- Docker Engine and Docker Compose: unavailable in current environment
- Docker-backed command failure: daemon unavailable at `/var/run/docker.sock`

This is environment evidence only. It does not establish permanent project capability or successful database runtime verification.

## Implemented scope

- `supabase/migrations/202607120001_phase_1_foundation.sql`: Phase 1 schema, forced RLS, no browser-role table grants, and constraints.
- `supabase/tests/phase_1_rls.test.sql`: pgTAP RLS, privilege, schema, index, constraint, trigger, and foreign-key assertions.
- `src/lib/db/**`, `src/server/**`, `src/app/api/auth/**`: server-only database access, internal auth, CSRF, rate limiting, audit, and consent services.
- `tests/unit/**`, `tests/integration/**`: unit coverage and real-PostgreSQL integration configuration.

## Source checkpoint commands and results

| Command                        | Result                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `npm run lint`                 | PASS                                                                                 |
| `npm run typecheck`            | PASS                                                                                 |
| `npm test`                     | PASS: 7 files, 21 tests                                                              |
| `npm run build`                | PASS without runtime secrets                                                         |
| `npm audit --audit-level=high` | PASS: 0 vulnerabilities                                                              |
| `npm run test:e2e`             | PASS: 4 Chromium/mobile public smoke tests                                           |
| Changed-file Prettier check    | PASS                                                                                 |
| `git diff --check`             | PASS                                                                                 |
| `npm run format:check`         | FAIL: pre-existing formatting outside Phase 1 scope in public pages, styles, and PRD |

## Database verification status

| Command                    | Status  | Reason                                                                |
| -------------------------- | ------- | --------------------------------------------------------------------- |
| `npm run db:reset`         | BLOCKED | Docker daemon unavailable; local Supabase cannot start.               |
| `npm run test:db`          | BLOCKED | No local Docker-backed PostgreSQL/Supabase instance.                  |
| `npm run test:integration` | BLOCKED | `TEST_DATABASE_URL` intentionally required; no local test DB started. |

After Docker and local Supabase are available, run `npm run db:start`, `npm run db:reset`, set local disposable `TEST_DATABASE_URL`, then run `npm run test:integration` and `npm run test:db`.

## Documentation status

Phase 1 security, QA, MCP, environment template, setup, and DOX maps document current implementation and blocked DB gates. No credential, token, raw answer, or private result value is recorded here.

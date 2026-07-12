# Phase 1 Verification

## Scope

Phase 1 verification covers database migration and RLS default deny, server-only environment/database boundary, internal auth, session lifecycle, CSRF, rate limits, audit, and consent persistence.

## Current evidence

Evidence comes from source checkpoint recorded in `.pi/EVIDENCE.md`.

| Gate                           | Current status     | Evidence                                                                         |
| ------------------------------ | ------------------ | -------------------------------------------------------------------------------- |
| `npm run lint`                 | PASS               | Phase 1 source checkpoint.                                                       |
| `npm run typecheck`            | PASS               | Phase 1 source checkpoint.                                                       |
| `npm test`                     | PASS               | 7 files, 21 tests at checkpoint.                                                 |
| `npm run build`                | PASS               | Build completed without runtime secrets at checkpoint.                           |
| `npm audit --audit-level=high` | PASS               | 0 vulnerabilities at checkpoint.                                                 |
| `npm run test:e2e`             | PASS               | 4 Chromium/mobile public smoke tests at checkpoint.                              |
| Changed-file Prettier          | PASS               | Phase 1 changed files formatted at checkpoint.                                   |
| Full `npm run format:check`    | FAIL, pre-existing | Existing public pages, styles, and PRD outside Phase 1 scope were not formatted. |
| `git diff --check`             | PASS               | Phase 1 source checkpoint.                                                       |
| `npm run db:reset`             | BLOCKED            | Docker daemon unavailable in current environment.                                |
| `npm run test:db`              | BLOCKED            | No Docker-backed local PostgreSQL/Supabase available.                            |
| `npm run test:integration`     | BLOCKED            | `TEST_DATABASE_URL` intentionally required; no local database started.           |

Docker absence is current-environment evidence, not permanent project behavior. Do not report DB gates as passed until commands below complete against local Supabase.

## Non-database checks

Run from repository root:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
git diff --check
```

When only Phase 1 documents or JSON templates changed, format changed files directly before full format baseline work:

```bash
npx prettier --write README.md AGENTS.md src/AGENTS.md tests/AGENTS.md docs/AGENTS.md \
  docs/ai/MCP_SETUP.md docs/security/PHASE_1_AUTH.md docs/qa/PHASE_1_VERIFICATION.md \
  .mcp.example.json .env.example
```

A direct changed-file formatter command does not convert existing full-repository formatting failure into a passing full repository gate.

## Docker and local Supabase verification

Install and start Docker Engine plus Docker Compose using operating-system instructions. Confirm daemon access before continuing:

```bash
docker --version
docker compose version
docker info
```

Then initialize local database from clean state:

```bash
cp .env.example .env.local
# Replace only local placeholders in .env.local; do not commit it.
npm run db:start
npm run db:reset
```

Obtain local connection information from Supabase CLI locally without committing or logging it in project files. Set test URL for current shell, then run real database gates:

```bash
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
```

If shell does not load `.env.local`, export a local disposable URL directly from secure local environment rather than adding it to source or test code. `TEST_DATABASE_URL` must never target shared, staging, or production database.

## Expected DB coverage

`npm run db:reset` must apply `202607120001_phase_1_foundation.sql` against empty local database.

`npm run test:db` runs `supabase/tests/phase_1_rls.test.sql` through pgTAP. It verifies:

- all Phase 1 tables exist;
- RLS is enabled and forced;
- no RLS policies exist on sensitive tables;
- `anon` and `authenticated` lack direct `SELECT`, `INSERT`, `UPDATE`, and `DELETE` table privilege;
- required columns, indexes, constraints, audit immutability trigger, and explicit foreign-key delete behavior remain present.

`npm run test:integration` uses real PostgreSQL and verifies schema/RLS metadata, account/session persistence, session revocation and expiration, consent record/revocation, DB fixed-window limits, duplicate registration opacity, valid/invalid login behavior, and idempotent logout.

## Auth regression checklist

When auth route or service changes, retain or add tests for:

- normalized email;
- Argon2id hash and verification;
- opaque token hashing and invalid verification;
- session expiration and revocation;
- generic duplicate registration response;
- valid and invalid login without account enumeration;
- logout idempotency;
- invalid CSRF rejection;
- rate-limit rejection;
- environment validation;
- RLS default deny and migration from database empty state.

Run E2E after any browser-visible auth flow is added; current E2E suite covers public routes only.

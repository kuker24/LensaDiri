# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sources of truth

- Read root `AGENTS.md` first. Its contracts apply repository-wide.
- Read the nearest child guide before changing its area: `src/AGENTS.md`, `tests/AGENTS.md`, `supabase/AGENTS.md`, or `docs/AGENTS.md`.
- `docs/product/PRD_FULL_LensaDiri.md` is the canonical product and engineering contract. Verify implementation claims against source and current QA evidence, especially `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md`.
- Keep the active Quick 40/Standard 60 legacy baseline distinct from modular PRD 2.0 work. Modular behavior is versioned, backward-compatible, and protected by feature flags that default off.
- Historical ADR and QA documents describe their recorded point in time. Do not silently rewrite historical decisions or present old verification as current evidence.

## Toolchain and commands

Requires Node.js 20.9+, npm 10+, and Docker-backed local Supabase for database suites.

```bash
npm ci                         # install the locked dependency tree
npm run dev                    # Next.js development server on localhost:3000
npm run build                  # production build
npm run start                  # serve the production build
npm run format:check           # verify Prettier formatting
npm run lint                   # ESLint with zero warnings
npm run typecheck              # generate Next types, then run tsc --noEmit
npm test                       # unit suite
npm run test:watch             # unit tests in watch mode
npm run check                  # lint, typecheck, unit tests, and build
npm audit --audit-level=high   # dependency audit gate
```

Focused tests:

```bash
npx vitest run tests/unit/example.test.ts
npx vitest run tests/unit/example.test.ts -t "test name"
npx vitest run --config vitest.integration.config.ts tests/integration/example.test.ts
npx playwright test tests/e2e/example.spec.ts --project=chromium
npx playwright test tests/e2e/example.spec.ts --project=mobile-chromium
```

Database and browser gates use disposable local data only:

```bash
npm run db:start
npm run db:reset
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
npm run test:seed-replay
npm run test:seed-replay-drift
npm run test:seed-upgrade-parity
npm run test:e2e
```

Never point reset, integration, pgTAP, seed, or E2E commands at hosted production. Production uses migration-only, fix-forward deployment documented in `docs/deployment/PRODUCTION_VERCEL_SUPABASE.md`.

## Architecture

LensaDiri is a privacy-first Next.js App Router application. Pages and route handlers live in `src/app`; reusable interactive and presentational UI lives in `src/components`. Server Components are the default. Use Client Components only where browser state or interaction requires them.

Trusted runtime flow:

1. App Router pages and Client Components call same-origin route handlers under `src/app/api`.
2. Route handlers validate request boundaries, authorization, CSRF, and rate limits before orchestration.
3. `src/server/services` coordinates trusted operations. `src/server/repositories` owns typed persistence without HTTP parsing.
4. `src/lib/db` validates server environment and provides server-only PostgreSQL access and transactions.
5. Pure engines under `src/lib/scoring` calculate deterministic, versioned results on the server. Modular dispatch must match both module key and scoring version from the immutable blueprint and fail closed on mismatch.
6. Supabase migrations define schema, forced RLS, grants, immutable modular content, and account erasure. Seeds provide legacy and independently scored modular item banks. pgTAP verifies database security contracts.

Assessment lifecycle spans `src/app/start`, `src/app/test/[token]`, `src/app/result/[token]`, and `src/app/shared/[token]`. The server owns catalog/composer selection, immutable blueprint and version provenance, session and answer persistence, completion, clarifiers, primary scoring, correlation, and result projection. Preserve legacy routes and result readers during modular migration.

Private, shared, and export results are separate DTO contracts. `src/server/repositories/result-views.ts` uses an explicit allowlist for public shared results. Never expose internal IDs, raw answers or scores, quality diagnostics, timing, scoring configuration, clarifier state, audit data, token hashes, or owner data through public views.

## Non-negotiable invariants

- Never calculate or alter primary scores in the browser or with AI.
- Each modular lens owns a versioned item bank and independent scoring engine. Legacy trait-derived overlays remain legacy-only.
- Keep database, repository, service, and secret-dependent imports inside server code. Preserve `server-only` guards.
- Store passwords with Argon2id and opaque tokens as HMAC hashes. Do not log or return passwords, raw tokens, raw IPs, raw user agents, raw answers, or private results.
- Cookie-authenticated mutations require strict validation, authorization, relevant rate limiting, and exact same-origin CSRF protection.
- Sensitive tables keep RLS enabled and forced, no browser policies, and no direct privileges for `anon` or `authenticated`.
- Published module versions, item content, and used blueprints are immutable. Add new versions and additive migrations instead of rewriting applied history.
- Results are private by default. Scientific copy must not claim diagnosis, certainty, absolute accuracy, proprietary instrument equivalence, or unsupported psychometric validation.
- Preserve keyboard access, semantic HTML, form labels, visible focus states, and reduced-motion behavior.

## Verification by change area

- TypeScript or route changes: `npm run lint && npm run typecheck`.
- Domain, auth, validation, token, scoring, or DTO changes: `npm test` plus focused tests.
- DB, repository, auth persistence, RLS, migration, or seed changes: clean local reset, integration, pgTAP, and relevant seed gates.
- User-visible flow changes: Playwright desktop and Pixel 5 projects.
- Documentation-only changes: run Prettier for changed docs and `git diff --check`. Do not autoformat the canonical PRD, which is intentionally excluded from Prettier.
- Before a PR, mirror CI: format check, lint, typecheck, unit tests, build, dependency audit, then database and browser gates when relevant. Record only commands actually run and their current results.

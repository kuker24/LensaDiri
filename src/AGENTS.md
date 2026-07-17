# Source Agent Guide

## Purpose

`src/` contains Next.js application surface and trusted server boundary: public/auth/dashboard UI, legacy and modular assessment/result flows, catalog/composer/clarifier APIs, validated database access, repositories, deterministic versioned scoring, correlation, and token security primitives.

## Ownership

- `app/`: public, auth, dashboard, assessment, private result, shared result, metadata, and global styles.
- `app/api/auth/`, `app/api/account/`, `app/api/assessment/`, `app/api/result/`, `app/api/shared/`: node-runtime HTTP boundaries.
- `components/`: shared presentational site components.
- `lib/auth/`: email normalization, Argon2id password helpers, safe redirect validation, and cookie contracts.
- `lib/db/`: Zod environment schema, server-only environment access, PostgreSQL client, transaction helper, and safe DB error mapping.
- `lib/scoring/`: pure Likert, versioned legacy profile scoring, independent modular engines, quality/confidence, clarifier decisions, dan narrative-only correlation.
- `lib/security/`: HMAC token, CSRF, HTTP parsing, and rate-limit primitives.
- `lib/validation/`: Zod request-boundary schemas.
- `server/repositories/`: typed persistence functions only; no request parsing or client exposure.
- `server/services/`: auth, consent, and rate-limit orchestration within trusted server boundary.
- `server/repositories/assessment.ts`: token-gated legacy/modular persistence, clarifier state, atomic completion, and private/shared result access.
- `server/repositories/blueprints.ts`: candidate loading plus immutable modular blueprint/session persistence; new modular Trait sessions resolve `trait_profile/modular-1` provenance.
- `server/repositories/catalog.ts`: module/mode/combo catalog and feature-flag reads.
- `server/repositories/result-views.ts`: explicit `PrivateResultView`, `SafeSharedResultView`, and `ExportResultView` projections; public mapper is allowlist-only.
- `lib/scoring/profile.ts`: pure, deterministic, versioned legacy Trait Profile scoring.
- `lib/scoring/modules/`: independent module engines and registry; dispatch is mandatory by `moduleKey` plus expected immutable-blueprint `scoringVersion`, and unknown/mismatch must fail closed.
- `lib/site.ts`: public site configuration.

## Local Contracts

- Keep Server Components default. Add Client Components only for required browser state or interaction.
- Use `@/*` imports, strict TypeScript, and no `any`.
- Import database, repository, and service modules only from server code. Preserve `server-only` guards and never import secret-dependent modules into client bundles.
- Parse environment through `getServerEnvironment`; exact required names are `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SESSION_SECRET`, `CSRF_SECRET`, `TOKEN_HASH_PEPPER`, and `RATE_LIMIT_SECRET`.
- Keep `src/lib/scoring/likert.ts` and `src/lib/scoring/profile.ts` pure, deterministic, versioned, and unit-tested. Browser must never calculate primary score.
- Treat current trait-derived 16-Type, motivation, and temperament output as legacy MVP interpretation only. Preserve old result reading, but do not use or expand it for new modular sessions.
- New lenses require own versioned item bank, module-level scoring service, confidence, and result DTO. Correlation may combine completed module outputs only after independent primary scoring.
- Store only Argon2id password hashes, HMAC hashes of session/assessment/result/share tokens, and hashed request fingerprints. Do not log or return password, raw token, raw IP, or raw user-agent.
- Auth, account, assessment, result, share, feedback, export, and deletion mutations require strict Zod boundary, authorization token/session, relevant rate limit, and exact same-origin CSRF where cookie-authenticated mutation applies. Preserve generic auth failures.
- `GET /api/auth/session` is CSRF bootstrap. Its signed token may be returned with `no-store`; session nonce cookie stays HttpOnly.
- Cookies remain `HttpOnly`, `SameSite=Lax`, path `/`, `Secure` in production, and use `__Host-` names in production.
- Public metadata, routes, logs, errors, and URL query must not expose raw answers, private results, tokens, or credentials. Shared routes return `SafeSharedResultView` only: no internal IDs, quality/ambiguity flags, confidence diagnostics, timing, raw scores, scoring versions, clarifier state, feedback, audit data, or token hashes.
- Preserve semantic HTML, keyboard access, visible focus states, labels, and reduced-motion support.
- Public copy must not claim diagnosis, certain predictions, absolute accuracy, validated psychometric status, or fake social proof.

## Work Guidance

1. Read root `AGENTS.md`, local `supabase/AGENTS.md` when persistence changes, and PRD 2.0 implementation phase plus acceptance criteria before source changes.
2. During modular migration, preserve Quick 40/Standard 60 route and result compatibility; introduce catalog/composer/module services behind shared domain boundaries and feature flags.
3. Keep immutable composer blueprint, selected module versions, scoring versions, item-bank versions, composer version, evidence tier, and report template versions server-authoritative. Legacy Trait uses `mvp-1`/`trait-profile-mvp-1`; modular Trait uses `modular-1`/`trait-profile-modular-1`.
4. Keep database use in the trusted server boundary. Browser roles have no direct auth or MVP assessment table privileges or RLS policies.
5. Add Zod validation at every route boundary and map database failures to safe public errors.
6. Preserve transactional and idempotent behavior for session revocation, answer upsert, assessment completion, account erasure, rate-limit updates, and consent changes.
7. Add focused regression tests for scoring, token, API, repository, auth, or interactive behavior changes.
8. Keep private application behavior fail-closed when protected routes expand.

## Verification

- Run `npm run lint` and `npm run typecheck` after TypeScript or route changes.
- Run `npm test` after domain, auth, CSRF, rate-limit, token, validation, scoring provenance, or result-DTO changes.
- Run `npm run test:seed-replay` after changing modular catalog/item-bank seed behavior.
- With Docker/local Supabase available, run `npm run db:reset`, `npm run test:integration`, and `npm run test:db` after DB, repository, or auth persistence changes.
- Run `npm run test:e2e` after user-flow changes.
- Run root mandatory checks before PR.

## Child DOX Index

No child DOX. Root, this local contract, and `supabase/AGENTS.md` cover current source boundaries.

# Source Agent Guide

## Purpose

`src/` contains Next.js application surface and trusted Phase 1 server boundary: public pages, internal auth route handlers, shared UI, validated database access, repositories, services, deterministic Likert primitive, and token security primitive.

## Ownership

- `app/`: routes, root layout, metadata, robots, sitemap, global styles, and API route handlers.
- `app/api/auth/`: node-runtime register, login, logout, and session/CSRF bootstrap endpoints.
- `components/`: shared presentational site components.
- `lib/auth/`: email normalization, Argon2id password helpers, safe redirect validation, and cookie contracts.
- `lib/db/`: Zod environment schema, server-only environment access, PostgreSQL client, transaction helper, and safe DB error mapping.
- `lib/scoring/`: pure scoring primitives. `likert.ts` remains Phase 0 primitive, not production assessment scoring.
- `lib/security/`: HMAC token, CSRF, HTTP parsing, and rate-limit primitives.
- `lib/validation/`: Zod request-boundary schemas.
- `server/repositories/`: typed persistence functions only; no request parsing or client exposure.
- `server/services/`: auth, consent, and rate-limit orchestration within trusted server boundary.
- `lib/site.ts`: public site configuration.

## Local Contracts

- Keep Server Components default. Add Client Components only for required browser state or interaction.
- Use `@/*` imports, strict TypeScript, and no `any`.
- Import database, repository, and service modules only from server code. Preserve `server-only` guards and never import secret-dependent modules into client bundles.
- Parse environment through `getServerEnvironment`; exact required names are `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SESSION_SECRET`, `CSRF_SECRET`, `TOKEN_HASH_PEPPER`, and `RATE_LIMIT_SECRET`.
- Keep `src/lib/scoring/likert.ts` pure and deterministic. It is not Phase 1 production assessment scoring.
- Store only Argon2id password hashes, HMAC hashes of opaque session tokens, and hashed request fingerprints. Do not log or return password, raw token, raw IP, or raw user-agent.
- Auth mutations require strict Zod JSON, exact same-origin CSRF validation, and rate-limit consumption before mutation work. Preserve generic duplicate-registration and invalid-credential responses.
- `GET /api/auth/session` is CSRF bootstrap. Its signed token may be returned with `no-store`; session nonce cookie stays HttpOnly.
- Cookies remain `HttpOnly`, `SameSite=Lax`, path `/`, `Secure` in production, and use `__Host-` names in production.
- Public metadata, routes, logs, errors, and URL query must not expose raw answers, private results, tokens, or credentials.
- Preserve semantic HTML, keyboard access, visible focus states, labels, and reduced-motion support.
- Public copy must not claim diagnosis, certain predictions, absolute accuracy, validated psychometric status, or fake social proof.

## Work Guidance

1. Read root `AGENTS.md`, local `supabase/AGENTS.md` when persistence changes, and relevant PRD acceptance criteria before source changes.
2. Keep database use in the trusted server boundary. Browser roles have no direct Phase 1 table privileges or RLS policies.
3. Add Zod validation at every route or server-action boundary and map database failures to safe public errors.
4. Preserve transactional and idempotent behavior for session revocation, rate-limit updates, and consent changes.
5. Add focused regression tests for scoring, token, API, repository, auth, or interactive behavior changes.
6. Keep private application behavior fail-closed when protected routes expand.

## Verification

- Run `npm run lint` and `npm run typecheck` after TypeScript or route changes.
- Run `npm test` after domain, auth, CSRF, rate-limit, token, or validation changes.
- With Docker/local Supabase available, run `npm run db:reset`, `npm run test:integration`, and `npm run test:db` after DB, repository, or auth persistence changes.
- Run `npm run test:e2e` after user-flow changes.
- Run root mandatory checks before PR.

## Child DOX Index

No child DOX. Root, this local contract, and `supabase/AGENTS.md` cover current source boundaries.

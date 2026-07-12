# Source Agent Guide

## Purpose

`src/` contains current Next.js application surface: App Router public pages, shared UI, site configuration, deterministic Likert primitive, and opaque-token primitive.

## Ownership

- `app/`: routes, root layout, metadata, robots, sitemap, and global styles.
- `components/`: shared presentational site components.
- `lib/scoring/`: pure scoring primitives.
- `lib/security/`: server-oriented token security primitives.
- `lib/site.ts`: public site configuration.

## Local Contracts

- Keep Server Components default. Add Client Components only for required browser state or interaction.
- Use `@/*` imports, strict TypeScript, and no `any`.
- Keep `src/lib/scoring/likert.ts` pure and deterministic. It is Phase 0 primitive, not production assessment scoring.
- Keep token pepper and other secrets server-only. Do not import secret-dependent logic into client bundles.
- Public metadata, routes, logs, errors, and URL query must not expose raw answers, private results, tokens, or credentials.
- Preserve semantic HTML, keyboard access, visible focus states, labels, and reduced-motion support.
- Public copy must not claim diagnosis, certain predictions, absolute accuracy, validated psychometric status, or fake social proof.

## Work Guidance

1. Read root `AGENTS.md` and relevant PRD acceptance criteria before source changes.
2. Treat database, auth, assessment persistence, result, and admin work as absent until implemented; do not assume target PRD paths exist.
3. Put validation at server or route boundaries when adding mutations.
4. Add focused tests with changes to scoring, token, route, or interactive behavior.
5. Keep private application behavior fail-closed when future protected routes are introduced.

## Verification

- Run `npm run lint` and `npm run typecheck` after TypeScript or route changes.
- Run `npm test` after scoring or token primitive changes.
- Run `npm run test:e2e` after user-flow changes.
- Run root mandatory checks before PR.

## Child DOX Index

No child DOX. Current source tree is small; root and this local contract cover existing boundaries.

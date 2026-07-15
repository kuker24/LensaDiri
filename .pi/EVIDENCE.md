# Engineering Evidence

## Objective

Reproducible hobby-production checkpoint for LensaDiri MVP and PRD v2 modular remediation: private internal-auth accounts, legacy Quick/Standard lifecycle, versioned modular assessment contracts, deterministic scoring, privacy controls, additive database migrations, GitHub source, and Vercel deployment backed by hosted Supabase PostgreSQL.

## Source checkpoint

- Branch: `agent/phase-1-foundation`
- Production URL: `https://lensadiri.vercel.app`
- Pull request: `https://github.com/kuker24/LensaDiri/pull/3`
- Production build source: GitHub repository branch above; exact commit recorded in PR and Vercel build logs
- Working-tree requirement: clean before and after verification

Production project identifiers, database URLs, access tokens, passwords, API keys, and secret values are intentionally excluded.

## Implemented scope

- Internal auth: opaque registration, Argon2id login, HttpOnly session, same-origin CSRF, logout, private dashboard, and permanent account erasure.
- Legacy assessment: consent, Quick 40, Standard 60, idempotent autosave, resume, atomic completion, deterministic server scoring, private result, feedback, share/revoke, safe JSON export, and result deletion.
- Modular remediation source: additive `trait_profile/modular-1`, version-aware scoring dispatch, immutable result provenance, replay-safe seed contract, and separated private/shared/export result DTOs.
- Privacy boundary: token HMAC hashes, forced RLS, no browser policies/direct table privileges, trusted server PostgreSQL client, generic API failures, and explicit allowlist mapping for public shared results.
- Operations: liveness-only health endpoint, Vercel/Supabase production guide, migration map, security headers, and ignored local runtime metadata.
- Modular release remains feature-flagged. P0/P1 remediation passes full disposable-local gates and three clean-reset loops; implementation commits `f8c1c3c` and `65f934b` exist locally, while audit/docs commit, branch push, and GitHub Actions remain pending. No production migration, deploy, or flag activation has occurred.

## Database provenance

Applied additive migration versions:

1. `202607120001_phase_1_foundation.sql`
2. `202607130001_account_hard_delete.sql`
3. `202607130002_mvp_assessment.sql`
4. `202607130003_mvp_feedback.sql`
5. `202607130004_portable_email_constraint.sql`

Migration history matched local SQL statement-by-statement. Hosted dry-run reported database up to date. Seed `20260713_mvp_item_bank.sql` is idempotent and produces 60 Standard questions, including 40 Quick questions. Hosted smoke found 15 forced-RLS tables and zero browser policies.

## Verification

Baseline verification used disposable local-only secrets and local Supabase PostgreSQL. No production reset or destructive test ran.

| Command or check                       | Result                                                                                                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`                               | PASS; lockfile unchanged.                                                                                                                                                                              |
| `npm run format:check`                 | PASS.                                                                                                                                                                                                  |
| `npm run lint`                         | PASS.                                                                                                                                                                                                  |
| `npm run typecheck`                    | PASS.                                                                                                                                                                                                  |
| `npm test`                             | PASS: `13 files / 53 tests`.                                                                                                                                                                           |
| `npm run build`                        | PASS using complete disposable test-only environment; no production credential used.                                                                                                                   |
| `npm audit`                            | PASS: `0 vulnerabilities`.                                                                                                                                                                             |
| `npm run db:reset`                     | PASS against disposable local Supabase only.                                                                                                                                                           |
| `npm run test:seed-replay`             | PASS: modules `10`, versions `5`, dimensions `27`, questions/translations/mappings `258`, combos `6`, combo mappings `27`; SHA-256 `b0168c9e675fb453f11e6227613b90ff2f710d69d3a44f42a4e8e857ea1fe75b`. |
| `npm run test:integration`             | PASS: `5 files / 21 tests`.                                                                                                                                                                            |
| `npm run test:db`                      | PASS: plans `66 + 48 + 92 = 206` assertions; command exit `0`.                                                                                                                                         |
| `CI=1 npm run test:e2e`                | PASS: `12/12`, 6 desktop Chrome and 6 Pixel 5 tests.                                                                                                                                                   |
| Three clean-reset loops                | PASS: each loop reset, replay, integration `21`, pgTAP `206`, E2E `12`; canonical seed hash unchanged.                                                                                                 |
| Scoped concrete-secret scan            | PASS: `0`; dummy CI values only.                                                                                                                                                                       |
| `git diff --check`                     | PASS.                                                                                                                                                                                                  |
| GitHub Actions for remediation commits | PENDING until commits are pushed; do not treat local evidence as merge approval.                                                                                                                       |

## Production evidence

- Supabase migration dry-run: remote up to date.
- Vercel Git integration: repository and `agent/phase-1-foundation` source confirmed in build logs.
- Vercel Git production build: Ready.
- `/api/health`: HTTP 200 with exactly `{"status":"ok"}`.
- Public route smoke: `/`, `/method`, `/privacy`, `/disclaimer`, `/login`, `/register`, and `/start` returned HTTP 200.
- Security headers: content-type sniffing, framing, referrer, permissions, opener, and resource policies present.
- Disposable production account smoke: registration 202, login 200, dashboard 200, deletion 200, post-delete login 401; record removed.

## Secret safety

- Broad name scan found environment-variable names, docs, placeholders, and dummy local fixtures only.
- Concrete credential scan found zero production secrets.
- Production project/token identifier scan in repository content found zero matches.
- History hits contained localhost/test-only dummy database URLs; no production credential evidence.
- `.env.local`, `.vercel/`, `supabase/.temp/`, `supabase/.branches/`, credential files, private keys, and dumps remain ignored.
- No credential rotation required from repository evidence.

## Residual risks

- P0/P1 remediation full local gates and three clean-reset loops PASS, but audit/docs commit, branch push, GitHub Actions, release migration map, backup/forward-fix decision, and audit delta remain required before hosted dry-run.
- PRD v2 remains PARTIAL: Complex/full-spectrum proof, public catalog/supporting routes, active-session dashboard, additional module engines, retention/consent expansion, operations readiness, formal WCAG, and psychometric validation remain open.
- Single hobby Supabase production project; no staging environment.
- Monitoring integration, backup/restore drill, custom domain, email verification, password reset, formal WCAG audit, and psychometric/domain-expert validation remain open.
- Keep `FEATURE_MODULAR_COMPOSER`, `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, and `FEATURE_AI_NARRATIVE` OFF in production.
- Never run local reset, destructive integration, pgTAP, or E2E suites against production.

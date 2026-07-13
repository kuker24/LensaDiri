# Engineering Evidence

## Objective

Reproducible hobby-production checkpoint for LensaDiri MVP: private internal-auth accounts, Quick/Standard assessment lifecycle, deterministic scoring, privacy controls, additive database migrations, GitHub source, and Vercel deployment backed by hosted Supabase PostgreSQL.

## Source checkpoint

- Branch: `agent/phase-1-foundation`
- Production URL: `https://lensadiri.vercel.app`
- Pull request: `https://github.com/kuker24/LensaDiri/pull/3`
- Production build source: GitHub repository branch above; exact commit recorded in PR and Vercel build logs
- Working-tree requirement: clean before and after verification

Production project identifiers, database URLs, access tokens, passwords, API keys, and secret values are intentionally excluded.

## Implemented scope

- Internal auth: opaque registration, Argon2id login, HttpOnly session, same-origin CSRF, logout, private dashboard, and permanent account erasure.
- Assessment: consent, Quick 40, Standard 60, idempotent autosave, resume, atomic completion, deterministic server scoring, private result, feedback, share/revoke, safe JSON export, and result deletion.
- Privacy boundary: token HMAC hashes, forced RLS, no browser policies/direct table privileges, trusted server PostgreSQL client, and generic API failures.
- Operations: liveness-only health endpoint, Vercel/Supabase production guide, migration map, security headers, and ignored local runtime metadata.
- Verification: unit, integration, pgTAP, Playwright desktop/Pixel 5, clean build, dependency audit, hosted migration dry-run, and production smoke.

## Database provenance

Applied additive migration versions:

1. `202607120001_phase_1_foundation.sql`
2. `202607130001_account_hard_delete.sql`
3. `202607130002_mvp_assessment.sql`
4. `202607130003_mvp_feedback.sql`
5. `202607130004_portable_email_constraint.sql`

Migration history matched local SQL statement-by-statement. Hosted dry-run reported database up to date. Seed `20260713_mvp_item_bank.sql` is idempotent and produces 60 Standard questions, including 40 Quick questions. Hosted smoke found 15 forced-RLS tables and zero browser policies.

## Final local verification

Verification used disposable local-only secrets and local Supabase PostgreSQL. No production reset or destructive test ran.

| Command                    | Result                         |
| -------------------------- | ------------------------------ |
| `npm ci`                   | PASS                           |
| `npm run format:check`     | PASS                           |
| `npm run lint`             | PASS                           |
| `npm run typecheck`        | PASS                           |
| `npm test`                 | PASS: 8 files, 25 tests        |
| `npm run build`            | PASS                           |
| `npm audit`                | PASS: 0 vulnerabilities        |
| `npm run db:reset`         | PASS: disposable local DB only |
| `npm run test:integration` | PASS: 2 files, 6 tests         |
| `npm run test:db`          | PASS: 2 files, 140 pgTAP tests |
| `npm run test:e2e`         | PASS: 10 desktop/Pixel 5 tests |
| `git diff --check`         | PASS                           |

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

- Single hobby Supabase production project; no staging environment.
- Monitoring integration, backup/restore drill, custom domain, email verification, and password reset remain open.
- Formal WCAG audit and psychometric/domain-expert validation remain deferred.
- Never run local reset, destructive integration, pgTAP, or E2E suites against production.

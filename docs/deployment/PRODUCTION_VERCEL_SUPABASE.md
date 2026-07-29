# Production Deployment: Vercel + Supabase

## Scope

Single hobby production environment. This workflow is migration-only: never run local reset, destructive integration tests, pgTAP, or Playwright data-lifecycle tests against hosted production.

## Required accounts

- One Supabase hosted project.
- One Vercel project linked to this repository or current working tree.
- CLI authentication is local and interactive. Never paste access tokens into chat, tracked files, shell history, or build logs.

## Supabase connection

Use Supabase transaction pooler connection string for Vercel `DATABASE_URL`. Keep SSL enabled. Application PostgreSQL client disables prepared statements and limits each production serverless instance to two database connections so paired dashboard reads do not serialize behind one connection.

Do not add Supabase anon or service-role keys. LensaDiri uses internal authentication and trusted server-side PostgreSQL access.

## Production environment variables

Set exactly these values in each Vercel environment that runs the application. Production and Preview must use separate values:

```text
NEXT_PUBLIC_APP_URL
DATABASE_URL
AUTH_SESSION_SECRET
CSRF_SECRET
TOKEN_HASH_PEPPER
RATE_LIMIT_SECRET
```

Optional: set `CRON_SECRET` (at least 16 characters, distinct from other secrets) to authorize the daily retention cleanup cron at `/api/cron/retention-cleanup`. Vercel sends it automatically as the `Authorization: Bearer` header for scheduled invocations. Without it the route fails closed. Add the same value as a GitHub Actions secret named `CRON_SECRET` so the retention monitor dry-run can verify eligibility.

Optional recovery email (dormant by default; do not set in production without explicit approval):

```text
EMAIL_FROM
RESEND_API_KEY
FEATURE_REQUIRE_EMAIL_VERIFICATION
```

Rules for recovery email:

- Leave `EMAIL_FROM` and `RESEND_API_KEY` unset to keep delivery disabled. Application boots and recovery APIs return generic accepted responses without sending mail.
- `EMAIL_FROM` must be a verified Resend sender (domain or single address). Prefer a dedicated subdomain such as `mail.example.com`.
- `RESEND_API_KEY` is server-only, min 20 characters when set, distinct per environment, never logged.
- `FEATURE_REQUIRE_EMAIL_VERIFICATION` defaults off. Set to `1` only after delivery is proven and product approves login gating. Legacy accounts with `email_verified_at IS NULL` are blocked until they verify; password reset and `/verify-email` remain available.
- Never set `RECOVERY_TEST_TRANSPORT` in Vercel. That flag is local/E2E only.
- Preview must use separate Resend credentials and isolated database; never reuse production keys.

Rules:

- `NEXT_PUBLIC_APP_URL` is the stable origin for its scope, such as the production alias or stable branch Preview alias; no path, query, or trailing configuration data.
- `DATABASE_URL` is a transaction pooler URL. Preview must use an isolated non-production database and must never point to production.
- Generate four distinct secrets with at least 32 characters each. Preview and Production secrets must differ. Do not reuse database password or Vercel/Supabase access tokens.
- Do not define `TEST_DATABASE_URL` in Vercel.
- Pin the Vercel project and CI runtime to Node.js 22.x. Keep `package.json` engine policy aligned.

## Initial empty-project database release

1. Create hosted Supabase project and retain database password in password manager.
2. Authenticate and link Supabase CLI locally.
3. Review pending migrations with dry-run.
4. Push only the reviewed additive migrations.
5. Stop before application launch. An empty project has schema but no legacy question bank. Publish the reviewed legacy seed through a separate content-publication approval and procedure.
6. After publication, confirm migration history, security invariants, and the legacy 60-question/40-Quick baseline through trusted dashboard/SQL editor without returning user data.

The current production project is not empty and already has the verified legacy 60-question/40-Quick baseline. Production seed remains outside the safe modular schema release.

Never run these against production:

```bash
npm run db:reset
npm run test:integration
npm run test:db
npm run test:e2e
```

Those commands remain local-only because they reset data or exercise destructive account/result flows.

## Vercel release

1. Authenticate Vercel CLI locally.
2. Link/create production project.
3. Set all six Production environment variables without printing values.
4. Configure Preview only after an isolated database and Preview-only secrets exist; otherwise keep Preview blocked and never reuse Production values.
5. Run local quality gates before deployment.
6. Deploy production and retain previous deployment URL for rollback.
7. Confirm stable production alias before setting `NEXT_PUBLIC_APP_URL`; redeploy after final origin is configured.

## Non-destructive production smoke checks

- `GET /api/health` returns HTTP 200 and only `{"status":"ok"}`.
- Landing, method, privacy, disclaimer, login, and register pages return HTTP 200.
- Security headers are present.
- Registration/login may be tested with one disposable account, followed by in-app permanent account deletion.
- Quick assessment smoke may use that disposable account only if result, share, feedback, and account are deleted afterward.
- Inspect Vercel function logs for generic errors only; never log request bodies, credentials, tokens, raw answers, or result payloads.

## Rollback

Application rollback: promote previous healthy Vercel deployment.

Database rollback: migrations are additive. Prefer fix-forward migration. Do not delete columns/tables or run reset. Before later migrations on non-empty production, create logical backup/export through Supabase-supported tooling and verify restore path.

## Current limitations

- Shared hobby production; isolated staging is provisioned only for approved drills.
- Recovery foundation (hash-only tokens, single-use, expiry, anti-enumeration, rate limits, session revoke on reset) is deployed. Live Resend delivery and mandatory verification stay off until secrets and product approval.
- Provider-level 5xx/latency thresholds and formal backup/restore tooling remain operator-configured.
- No formal psychometric validation or automated WCAG audit.
- Free-tier availability, quotas, and project pausing apply.

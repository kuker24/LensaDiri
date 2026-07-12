# Phase 1 Auth Security Contract

## Scope and trust boundary

Phase 1 adds internal authentication and persistence foundation. Next.js node-runtime route handlers plus server-only repositories and services form trusted application boundary. Browser clients do not receive a PostgreSQL client, database credential, service-role credential, or direct access to sensitive tables.

Routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

`GET /api/auth/session` both reports authentication state and bootstraps signed CSRF token/cookie state. Auth UI is not part of Phase 1.

## Database schema and RLS

Migration `supabase/migrations/202607120001_phase_1_foundation.sql` defines:

| Table              | Purpose                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `accounts`         | Normalized email, Argon2id PHC password hash, role/status, timestamps, and soft-delete state.           |
| `account_sessions` | HMAC-hashed opaque session token, hashed fingerprint data, expiry, revocation, and activity timestamps. |
| `consents`         | Versioned accepted/rejected consent ledger linked to account or reserved Phase 3 session identifier.    |
| `rate_limits`      | HMAC-hashed fixed-window route identity counters.                                                       |
| `audit_logs`       | Append-only operational audit events with constrained object metadata.                                  |

All five tables use UUID primary keys and `timestamptz`. Constraints enforce normalized email, live-email uniqueness, Argon2id PHC format, token/fingerprint hash format, expiry/revocation ordering, consent decision state, constrained rate-limit routes, and constrained audit events.

`accounts.deleted_at` together with `status = 'deleted'` is soft-delete state. `account_sessions` cascades only if a rare account hard delete occurs; consent and audit account references become `NULL` to retain their records. Audit update and delete are rejected by database trigger.

RLS is enabled and forced on every Phase 1 table. Migration revokes all table privileges from `public`, `anon`, and `authenticated`; no RLS policy grants browser access. Trusted server database connection is sole table-access path. Do not add browser policies, `security definer` RPCs, or new direct grants without security review and corresponding pgTAP regression coverage.

## Credentials and server environment

Server environment parser requires these names:

```text
DATABASE_URL
NEXT_PUBLIC_APP_URL
AUTH_SESSION_SECRET
CSRF_SECRET
TOKEN_HASH_PEPPER
RATE_LIMIT_SECRET
```

All secrets require at least 32 characters and remain server-only. `NEXT_PUBLIC_APP_URL` must be origin-only. No Supabase service-role key is used by current implementation. `.env.example` contains placeholders only; `.env.local` remains ignored.

## Passwords and sessions

Passwords use Argon2id with memory cost `65536`, time cost `3`, and parallelism `1`. Missing-account login performs fixed dummy Argon2id verification before generic credential failure, reducing account-enumeration timing distinction.

Session token is 32 random bytes encoded base64url. Database stores only SHA-256 HMAC with `TOKEN_HASH_PEPPER`; it never stores raw session token. Token primitive exposes constant-time HMAC-hash verification; session lookup computes deterministic HMAC then uses indexed database equality. Session record includes explicit expiry, revocation, and account active-status checks. Logout is idempotent: it clears cookie and safely attempts revocation when token exists.

Session cookie has `HttpOnly`, `SameSite=Lax`, path `/`, expiry/max-age, and `Secure` only in production. Production cookie name uses `__Host-lensadiri_session`. Session responses are `Cache-Control: no-store`.

## CSRF and request boundary

Cookie-authenticated mutations require both:

1. `Origin` exactly matching configured `NEXT_PUBLIC_APP_URL` origin.
2. `x-csrf-token` containing valid timestamped HMAC token bound to HttpOnly CSRF nonce cookie.

CSRF nonce is 32 random bytes. CSRF signed token lifetime is two hours and signature/nonce checks use constant-time comparison. Production CSRF cookie uses `__Host-lensadiri_csrf`, plus `HttpOnly`, `SameSite=Lax`, path `/`, and `Secure` in production.

Route body parser accepts strict Zod credentials schema only. Email is normalized and password is constrained to 12 through 128 characters. Optional `redirectTo` accepts internal paths only, not protocol-relative or backslash variants; it is not used for server redirect during Phase 1.

## Rate limits and public error behavior

Rate limit uses HMAC hash of route plus request identity with `RATE_LIMIT_SECRET`, persisted in fixed database windows. Current policies:

| Flow              | Limit |     Window |
| ----------------- | ----: | ---------: |
| Register          |     3 |     1 hour |
| Login             |     5 | 15 minutes |
| Session bootstrap |    60 | 15 minutes |
| Logout            |    30 | 15 minutes |

Register returns same `202` response for new and duplicate email. Login invalid credentials return generic `401`. Rate-limit response is `429` plus `Retry-After`; invalid CSRF response is `403`; unavailable DB maps to generic `503`. Response bodies do not include raw credentials, tokens, or database error details.

## Audit and consent

Sensitive auth and consent operations record constrained audit actions. Audit metadata records limited operational outcomes only. It must never include password, raw token, raw answer, private result, raw IP address, or raw user-agent string.

Consent service supports these versioned types:

```text
assessment_processing
result_storage
research_optional
marketing_optional
ai_feature_optional
```

A record is accepted or rejected exactly once. Revocation requires prior acceptance. Consent persistence is server-side; assessment answer persistence is not yet implemented.

## Verification state

Source-level and non-Docker gates have evidence in `.pi/EVIDENCE.md`: lint, typecheck, unit tests, build, audit, and browser smoke tests passed for Phase 1 source checkpoint. Full repository Prettier still has pre-existing failures outside Phase 1 scope.

Docker-backed runtime verification is blocked in current environment because Docker daemon is unavailable. Migration reset, pgTAP RLS test, and real PostgreSQL integration suite must run after Docker/local Supabase becomes available. See [Phase 1 verification](../qa/PHASE_1_VERIFICATION.md). Static SQL review is not runtime RLS verification.

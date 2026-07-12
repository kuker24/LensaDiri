# Supabase Database Contract

## Scope

`migrations/` owns schema changes. `seed/` holds non-production development data. `tests/` holds database verification scripts.

## Security boundary

All Phase 1 tables are sensitive. RLS is enabled and forced with no browser-role policies. `anon` and `authenticated` receive no direct table privileges. Next.js server code, using server-only credentials outside client bundles, is trusted boundary. Do not expose service-role credentials, create browser policies, or add `security definer` RPCs without focused security review.

## Data rules

- Store only HMAC hashes of opaque session tokens. Never store raw tokens.
- Store Argon2id PHC password hashes only. Never store plaintext passwords.
- Normalize account email to lowercase trimmed form before insert.
- Treat `accounts.deleted_at` plus `status = 'deleted'` as soft delete state.
- Keep `consents` and `audit_logs` append-only in application behavior.
- Do not place raw answers, private results, passwords, tokens, IP addresses, or user-agent strings in `audit_logs.metadata_json`.

## Verification

Run migrations against clean local Supabase database, then execute `tests/phase_1_rls.test.sql` through pgTAP tooling. Docker absence blocks local DB reset and runtime RLS verification; static SQL review does not replace it.

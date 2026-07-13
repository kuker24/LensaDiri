# Supabase Database Contract

## Scope

`migrations/` owns auth, account erasure, assessment/result, share, and feedback schema changes. `seed/` holds original non-production item-bank data. `tests/` holds pgTAP verification scripts.

## Security boundary

All auth and MVP assessment tables are sensitive. RLS is enabled and forced with no browser-role policies. `anon` and `authenticated` receive no direct table privileges. Next.js server code is trusted boundary. `hard_delete_account_by_session` is sole security-definer exception; browser execution is revoked and pgTAP-covered.

## Data rules

- Store only HMAC hashes of opaque session tokens. Never store raw tokens.
- Store Argon2id PHC password hashes only. Never store plaintext passwords.
- Normalize account email to lowercase trimmed form before insert.
- Account deletion is permanent after password re-authentication and exact confirmation; linked session, consent, assessment, result, share, and audit records must disappear atomically.
- Keep `consents` and `audit_logs` append-only except scoped trusted account-erasure transaction.
- Store assessment session, private result, and share tokens as HMAC hashes only.
- Feedback remains server-only, rating-constrained, message-bounded, and cascades with result deletion.
- Keep item bank original, versioned, and free from proprietary instrument text.
- Do not place raw answers, private results, passwords, tokens, IP addresses, or user-agent strings in `audit_logs.metadata_json`.

## Verification

Run `npm run db:reset` against clean local Supabase, then `npm run test:integration` with disposable `TEST_DATABASE_URL` and `npm run test:db`. pgTAP executes both `tests/phase_1_rls.test.sql` and `tests/mvp_assessment_rls.test.sql`. Local DB gates passed on 2026-07-13; rerun after migration, seed, repository, auth, or assessment changes. Static SQL review never replaces runtime verification.

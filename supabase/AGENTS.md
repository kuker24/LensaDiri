# Supabase Database Contract

## Scope

`migrations/` owns auth, account erasure, assessment/result, share, feedback, and future modular catalog/blueprint/result schema changes. `seed/` holds original item-bank data. `tests/` holds pgTAP verification scripts. Current Quick 40/Standard 60 schema is production baseline; PRD 2.0 module catalog, Test Composer, independent module result, and correlation schema remain targets until implemented.

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
- Preserve existing Quick 40/Standard 60 sessions and results through modular migration. Map them to legacy version metadata without retroactively rewriting answers or scores.
- Published module versions and used assessment blueprints become immutable. New item/scoring/report revisions require new versions.
- Add modular schema through additive, backward-compatible migrations; deploy compatible read paths before write cutover, backfill separately/resumably, gate new writes behind feature flags, and use fix-forward instead of rewriting applied migrations.
- Keep production migration-only. Never run reset, destructive integration, pgTAP, or E2E against hosted production.
- Do not place raw answers, private results, passwords, tokens, IP addresses, or user-agent strings in `audit_logs.metadata_json`.

## Verification

Run `npm run db:reset` against clean local Supabase, then `npm run test:integration` with disposable `TEST_DATABASE_URL` and `npm run test:db`. pgTAP executes both `tests/phase_1_rls.test.sql` and `tests/mvp_assessment_rls.test.sql`. Local DB gates passed on 2026-07-13; rerun after migration, seed, repository, auth, or assessment changes. Static SQL review never replaces runtime verification.

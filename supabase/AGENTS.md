# Supabase Database Contract

## Scope

`migrations/` owns auth, account erasure, legacy assessment/result/share/feedback, modular catalog/version/content, immutable blueprint/session segments, module result/correlation, feature flag, and clarifier schema. `seed/` holds original legacy and independent modular item-bank/catalog data. `tests/` holds pgTAP verification scripts. Quick 40/Standard 60 remains production baseline; modular schema exists on branch but has not been migrated or activated in production.

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
- Published module versions/content and used assessment blueprints are immutable. New item/scoring/report revisions require additive versions; `trait_profile/mvp-1` remains legacy while `trait_profile/modular-1` owns `trait-profile-modular-1` content and provenance for modular sessions.
- Every seed owns explicit module/version rows only. `20260713_mvp_item_bank.sql` is restricted to legacy Trait `mvp-1`; modular seeds and `20260716_trait_profile_modular.sql` use insert-once owned content. Full seed replay must be a no-op with stable counts/content hash and must never update published content or disable immutability triggers.
- Add modular schema through additive, backward-compatible migrations; deploy compatible read paths before write cutover, backfill separately/resumably, gate new writes behind feature flags, and use fix-forward instead of rewriting applied migrations.
- Keep production migration-only. Never run reset, destructive integration, pgTAP, or E2E against hosted production.
- Do not place raw answers, private results, passwords, tokens, IP addresses, or user-agent strings in `audit_logs.metadata_json`.
- `cleanup_expired_retention_data(timestamptz)` deletes only expired guest sessions and rate-limit buckets older than 90 days; it is idempotent and never touches account-owned results. `preview_expired_retention_data(timestamptz)` (migration `202607280001`) is its read-only dry-run companion that only counts eligible rows. Both are security-definer and revoked from `anon`/`authenticated`.

## Verification

Run `npm run db:reset` against clean local Supabase, then `npm run test:seed-replay` to replay every configured seed twice. Gate rejects duplicates and enabled flags, then requires reviewed module/version/dimension/item/translation/mapping/combo counts plus canonical SHA-256. Run `npm run test:seed-replay-drift` afterward: it must reject intentional local canonical drift, restore it, and pass replay again. Target evidence recorded modules `10`, versions `5`, dimensions `27`, questions/translations/mappings `258`, combo presets `6`, combo mappings `27`, and SHA-256 `b0168c9e675fb453f11e6227613b90ff2f710d69d3a44f42a4e8e857ea1fe75b`.

Then run `npm run test:integration` with disposable `TEST_DATABASE_URL` and `npm run test:db`. pgTAP includes modular RLS/provenance assertions. Full remediation gates and three clean-reset loops remain required before release evidence. Static SQL review never replaces runtime verification.

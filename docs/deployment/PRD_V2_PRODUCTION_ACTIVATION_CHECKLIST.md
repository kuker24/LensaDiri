# PRD v2 Production Activation Checklist

> **Status**: Draft — belum dieksekusi
> **Trigger**: Memerlukan approval eksplisit sebelum setiap langkah produksi
> **Tanggal dibuat**: 2026-07-18

---

## Pre-Flight

- [ ] Backup/logical backup production database (pg_dump read-only verification)
- [ ] Verify all feature flags remain `false` (query Supabase dashboard or API)
- [ ] Confirm no pending migration will break schema compatibility

## Database

- [ ] Obtain explicit approval for the production migration window
- [ ] Apply pending additive migration `202607200002` (quality model version)
- [ ] Postcheck migration history, schema parity, forced RLS, grants, and compatibility
- [ ] Obtain separate approval for reviewed modular content publication
- [ ] Publish only approved modular content through the migration-only production workflow
- [ ] Verify canonical counts, provenance, and absence of duplicate keys or constraint violations

## Feature Flags

- [ ] Verify every row in production `feature_flags` remains `enabled = false`
- [ ] Obtain explicit approval for each feature activation stage
- [ ] Enable modular flags **gradually** through the controlled server-side feature flag boundary
- [ ] Never enable multiple release stages without completing the preceding smoke checks
- [ ] Record each approved flag change in the deployment log

## Smoke Test (Post-Activation)

- [ ] GET `/api/health` returns `{"status":"ok"}`
- [ ] GET `/start/modules` renders module selection UI (no crash)
- [ ] POST `/api/assessment/estimate` with valid payload returns estimate
- [ ] POST `/api/assessment/start` creates session (check session table)
- [ ] POST `/api/test/[token]/submit` receives answer payload
- [ ] GET `/result/[token]` loads result page (no 403/500)

## Monitoring & Rollback

- [ ] Monitor Vercel function logs for 15 minutes post-activation
- [ ] Monitor Supabase query performance (slow query log)
- [ ] Prepare application rollback plan: disable modular feature flags first
- [ ] Retain the previous healthy Vercel deployment ID and URL for approved alias rollback
- [ ] Prepare additive database fix-forward plan; never reset or destructively roll back production schema
- [ ] Confirm `lensadiri.vercel.app` points to the intended healthy production deployment after any approved rollback

## Explicit Approval Points

Each step below requires separate approval from product owner:

1. **Backup and migration window** — approval before any production database write
2. **Migration application** — approval after checksum, dependency, and dry-run review
3. **Content publication** — approval after language, construct, bias, and pilot review sign-off
4. **Feature flag activation** — approval before each server-side flag change
5. **Smoke test sign-off** — approval after all release-stage smoke tests pass
6. **Go-live announcement** — approval before any public communication

---

## Notes

- Production URL: `https://lensadiri.vercel.app`
- Current production deployment: `dpl_3sjiYH9zkF3tbBZ8x6FABGHZgAUN`
- Latest main commit: `5c84f25c8b531344deaa86cd73ccdb53590f0311`
- Modular feature flags are currently **OFF** — do not enable without approval

# Project Memory

## Project

LensaDiri adalah platform eksplorasi kepribadian modular, privacy-first, dan mobile-first untuk pengguna Indonesia.

## Stack

Next.js 16.2.10 App Router, React 19.2.7, TypeScript strict, Tailwind CSS 4, PostgreSQL/Supabase, Zod, Vitest, Playwright, dan pgTAP.

## Architecture

- Sepuluh modul memakai scoring independen, deterministic, dan versioned.
- Modular assessment memakai immutable blueprint, segmented session, server-side primary scoring, dan safe result DTO projection.
- Sepuluh modul production-selectable: empat baseline, empat pilot (`three_center`, `instinct`, `riasec`, `attachment`), dan dua experimental (`socionics_communication`, `psychosophy`).

## Decisions

- Rate-limit DB upsert tetap fail-closed dan tidak dihapus.
- Rate-limit transaction memakai `SET LOCAL lock_timeout = 1000` dan `statement_timeout = 1500`.
- `consumeRateLimit()` memakai deadline wall-clock 2 detik agar antrean pool tidak menggantung route.
- Estimate rate-limit failure mengembalikan `503 service_temporarily_busy`.
- Start rate-limit failure mengembalikan `503 rate_limit_unavailable` dan tidak membuat session.
- Fix rate-limit tidak memerlukan migration, seed, feature flag, atau production write.

## Commands

```bash
npm run format:check && npm run lint && npm run typecheck && npm test
npm run build && npm audit --audit-level=high
npm run db:reset
npm run test:seed-replay && npm run test:seed-replay-drift
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' npm run test:integration
npm run test:db
TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres' npm run test:e2e
```

## Important Paths

- `src/server/repositories/rate-limits.ts`: transaction-local DB timeout.
- `src/server/services/rate-limiter.ts`: 2-second wall-clock deadline.
- `tests/integration/rate-limit-contention.test.ts`: deterministic real PostgreSQL lock regression.
- `supabase/migrations/202607270001_guarded_all_lenses_release.sql`: production-applied guarded-lens release.

## Constraints

- Jangan push ke main, force-push/rewrite history, atau menyentuh production tanpa approval.
- Semua scoring primer tetap server-side.
- Psychosophy tetap experimental, acknowledgement-required, dan confidence evidence-oriented weight 0.
- `.pi/memory/` adalah data lokal untracked dan tidak masuk commit.

## Verified State

- Production baseline HEAD sebelum PR #16: merge PR #15 commit `9ff30cf`.
- Branch aktif: `agent/fix-rate-limit-lock-contention`.
- PR #16: `https://github.com/kuker24/LensaDiri/pull/16`, open dan mergeable.
- Branch HEAD: `831228e`.
- Local regression evidence: 117 unit, 33 integration, 236 pgTAP, 58 E2E desktop/mobile, dan 42 accessibility tests lulus sebelum final rerun.
- Canonical seed hash: `45275f2a39fc284e8cb716c4b7c84b332fbcc3d150ce0fa83a0b040ec6739212`.

## Active Risks

- PR #16 GitHub Actions masih harus selesai hijau pada HEAD terbaru.
- Production sequential modular QA baru boleh dijalankan setelah merge dan auto-deploy main sukses.

## Next Steps

- Tunggu CI PR #16 hijau, lalu merge hanya melalui PR jika disetujui.
- Setelah auto-deploy main Ready, jalankan controlled sequential QA untuk RIASEC Quick, Attachment age gate, dan Psychosophy/Socionics acknowledgement.
- Hapus akun QA setelah production verification.

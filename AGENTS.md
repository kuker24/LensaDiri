# LensaDiri Agent Guide

Dokumen ini adalah kontrak kerja dan peta DOX tingkat root untuk coding agent dan contributor.

## Project Purpose

LensaDiri adalah platform eksplorasi kepribadian modular, privacy-first, dan mobile-first untuk pengguna Indonesia. Produk memberi lensa refleksi diri, bukan diagnosis klinis atau instrumen psikometri tervalidasi.

## Project State

- Status repository: **ESTABLISHED**. MVP hobby production aktif; branch `agent/phase-1-foundation` memuat implementasi modular PRD 2.0 yang masih menjalani remediation dan belum dirilis ke production.
- Status peta DOX: **CURRENT**. Root map dan child DOX `src/`, `tests/`, `docs/`, serta `supabase/` membedakan baseline production, implementasi modular feature-flagged, dan gap release.
- `docs/product/PRD_FULL_LensaDiri.md` versi 2.0 adalah canonical product and engineering contract. `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md` mencatat evidence dan blocker audit terbaru selama remediation.
- Public landing, metode, privasi, disclaimer, auth UI, dashboard privacy, health endpoint, legacy assessment, modular selection/review, runner, dan report UI tersedia.
- Internal auth mencakup register/login/logout, session HttpOnly, CSRF, rate limit, password Argon2id, dan hard-delete akun dengan re-authentication.
- Baseline production tetap Quick 40/Standard 60 dengan legacy result compatibility. Modular catalog, estimate, immutable Test Composer, pause/resume, clarifier runtime, independent scoring untuk Trait Profile, 16-Type, Enneagram, dan Temperament, correlation, serta modular result reader sudah ada pada branch tetapi `FEATURE_MODULAR_COMPOSER` default OFF.
- Candidate lokal terbaru memiliki evidence unit 64, integration 46, pgTAP 237, dan Playwright 22 desktop/mobile. Tiga clean-reset loop, seed replay/drift/upgrade parity, build, serta audit dependency lulus. Commit/push dan GitHub Actions pada SHA candidate masih wajib sebelum release.
- Hobby production baseline aktif di `https://lensadiri.vercel.app` dengan Supabase hosted Singapore. Modular migration, seed, deployment, dan feature activation production belum dijalankan. Account-recovery foundation sudah ada lokal tetapi provider email dan mandatory verification tetap blocked external. Monitoring, backup/restore drill, custom domain, staging terpisah, admin UI, formal accessibility audit, dan psychometric validation belum selesai.

## Technology

- Next.js 16.2.10 App Router dan React 19.2.7.
- TypeScript strict, Tailwind CSS 4, ESLint, dan Prettier.
- Zod 4 untuk validasi environment dan request boundary.
- `postgres` sebagai driver PostgreSQL server-only, `argon2` untuk password hashing, dan `server-only` sebagai import guard.
- Vitest untuk unit dan integration test, Playwright untuk browser smoke test, dan pgTAP melalui Supabase CLI untuk database test.
- GitHub Actions untuk quality gate.

## Entry Points

- `src/app/layout.tsx`: root layout, metadata, viewport, skip link, dan shared site chrome.
- `src/app/page.tsx`: landing page `/`.
- `src/app/method/`, `src/app/privacy/`, `src/app/disclaimer/`, `src/app/login/`, `src/app/register/`, dan `src/app/dashboard/`: public information, auth UI, serta account privacy routes.
- `src/app/start/`, `src/app/test/[token]/`, `src/app/result/[token]/`, dan `src/app/shared/[token]/`: assessment dan result flow.
- `src/app/api/auth/`, `src/app/api/account/`, `src/app/api/assessment/`, `src/app/api/result/`, dan `src/app/api/shared/`: trusted auth, assessment, result, export, feedback, share, dan deletion boundaries.
- `src/lib/db/`, `src/server/repositories/`, dan `src/server/services/`: validated PostgreSQL access serta trusted orchestration.
- `src/lib/scoring/likert.ts`, `src/lib/scoring/profile.ts`, dan `src/lib/scoring/modules/`: deterministic legacy scoring serta independent modular engines; modular dispatch harus mengikuti immutable blueprint scoring provenance.
- `supabase/migrations/`: foundation, account erasure, legacy assessment/result, feedback, modular catalog/composer/result, dan clarifier schema; `supabase/seed/` memuat legacy serta independent modular item banks.

## Repository Structure

```text
src/                 Next.js application, server boundary, shared UI, dan domain primitives
  app/               App Router, public/auth/dashboard/assessment/result routes, dan API handlers
  components/        Shared presentational dan interactive flow components
  lib/               Auth, assessment client, DB, scoring, security, validation, dan site config
  server/            Trusted repositories, services, session guard, dan HTTP DTO helpers
supabase/            Local Supabase config, migrations, seeds, and pgTAP database tests
tests/               Vitest unit, PostgreSQL integration, and Playwright browser tests
docs/                Product, architecture, security, QA, privacy, and AI tooling documentation
.github/workflows/   CI workflows
```

## Global Contracts

### Sebelum mengubah kode

1. Baca `docs/product/PRD_FULL_LensaDiri.md` versi 2.0 sebagai canonical contract.
2. Bedakan fakta baseline production dari target PRD; jangan mengklaim target modular sudah ada.
3. Kerjakan fase PRD 2.0 berurutan: Contract Freeze, Modular Backend Foundation, Minimal-Complete Frontend, Independent Scoring, lalu Combo/Complex/Clarifier.
4. Pertahankan backward compatibility untuk Quick 40/Standard 60, route lama, dan legacy result selama migrasi.
5. Pertahankan server sebagai sumber kebenaran untuk composer blueprint, session, answer, scoring, dan result.
6. Gunakan additive migration, feature flag, read compatibility sebelum write cutover, serta fix-forward; jangan reset data production.

### Security invariants

- Jangan pernah menghitung skor primer di client.
- Setiap lensa baru wajib memiliki item dan scoring independen. Jangan memperluas trait-derived legacy overlay untuk session modular baru.
- Jangan pernah mengirim service role key, pepper, session secret, atau raw database credential ke client.
- Simpan session token, result token, dan share token sebagai hash atau keyed hash.
- Result selalu private kecuali pengguna melakukan aksi berbagi yang eksplisit.
- Endpoint sensitif harus fail closed.
- Jangan menaruh raw answer atau private result pada metadata, log, analytics, URL query, atau error message.
- Mutation wajib memakai validasi input, authorization, rate limit, dan proteksi CSRF yang sesuai.
- Tabel auth dan MVP assessment wajib tetap RLS forced, tanpa policy browser, serta tanpa privilege direct untuk `anon` atau `authenticated`.
- Jangan menyimpan password plaintext, raw session token, raw IP, atau raw user-agent.

### Scientific and content invariants

- Jangan memakai klaim diagnosis, akurasi mutlak, atau prediksi pasti.
- Jangan menyalin item instrumen proprietary.
- Tampilkan evidence tier dan batasan hasil.
- AI tidak boleh menghitung atau mengubah skor primer.
- Jangan membuat testimonial, jumlah pengguna, rating, atau bukti sosial palsu.

### Code standards

- TypeScript strict dan hindari `any`.
- Server Components menjadi default.
- Client Components hanya untuk interaksi yang memang membutuhkan browser state.
- Validasi boundary memakai Zod atau validator setara.
- Fungsi scoring harus pure, deterministic, versionable, dan memiliki unit test.
- Gunakan import alias `@/*`.
- Jaga aksesibilitas keyboard, label form, focus state, reduced motion, dan semantic HTML.

## Common Commands

```bash
npm run dev                # Next.js development server
npm run build              # production build
npm run start              # serve production build
npm run lint               # ESLint, zero warnings
npm run lint:fix           # ESLint autofix
npm run typecheck          # Next type generation and TypeScript check
npm run format             # format repository with Prettier
npm run format:check       # verify Prettier formatting
npm test                   # run Vitest unit suite once
npm run test:watch         # run Vitest in watch mode
npm run test:integration   # run real PostgreSQL integration suite; TEST_DATABASE_URL required
npm run db:start           # start local Supabase; Docker required
npm run db:reset           # reset local Supabase and apply migrations; Docker required
npm run test:db            # run pgTAP database tests; Docker required
npm run test:seed-replay         # replay configured seeds twice and verify pinned canonical counts/hash
npm run test:seed-replay-drift   # prove local canonical drift is rejected, restored, then replayed
npm run test:e2e                 # run serial Playwright desktop + Pixel 5 tests against disposable shared DB
npm audit                  # audit production and development dependency tree
npm run check              # lint, typecheck, unit test, and build
```

## Verification

Sebelum PR, wajib jalankan:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

Untuk perubahan DB, auth server flow, RLS, atau repository:

```bash
npm run db:reset
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
```

Untuk perubahan flow UI, wajib jalankan:

```bash
npm run test:e2e
```

GitHub Actions menjalankan clean install, format, lint, typecheck, unit, build, dependency audit, disposable Supabase reset, integration, pgTAP, seed replay, reset ulang, serta serial Playwright desktop/Pixel 5. CI memakai dummy test-only environment values; production credential tidak boleh masuk workflow.

Definition of done: requirement terpenuhi, input tervalidasi, error state aman, test relevan tersedia, aksesibilitas diperiksa, dokumentasi diperbarui, dan CI hijau.

## Known Constraints

- PRD 2.0 adalah canonical contract. Implementasi modular saat ini partial dan feature-flagged; status hanya boleh dinaikkan berdasarkan backend, frontend, database, test, privacy, dan feature-flag evidence.
- Existing `quick` dan `standard` legacy tetap valid; modular memakai public label Quick/Normal/Complex. Complex dan Full Spectrum terverifikasi lokal tetapi tetap default OFF dan belum production-release-ready.
- Existing trait-derived overlays adalah legacy MVP interpretation. Reader lama wajib tetap bekerja; session modular memakai per-module items dan independent scoring.
- Trait modular remediation mempertahankan `trait_profile/mvp-1` untuk legacy dan menambah additive `modular-1` dengan `trait-profile-modular-1`. Composer/blueprint/result provenance dan scoring registry wajib match by module key plus scoring version; unknown or mismatched version fails closed. Do not mutate published version or old result.
- Full seed replay uses `npm run test:seed-replay`: configured seeds replay twice, all flags stay false, duplicates are rejected, and reviewed canonical count/hash must match. `npm run test:seed-replay-drift` must reject intentional local identity drift, restore it, and pass replay again. Published-content immutability trigger remains required; every seed touches only owning module/version content.
- Private result, public shared result, and export use separate contracts. `toSafeSharedResultView()` is explicit allowlist mapping; public share never exposes quality diagnostics, raw scores, timing, IDs, scoring configuration, clarifier data, feedback, audit data, token hashes, or owner data.
- Scoring dan item bank bersifat reflektif, original Bahasa Indonesia, dan belum melewati formal domain-expert validation, norming, reliability, factor, test-retest, atau DIF study.
- Database runtime lokal memakai Docker-backed Supabase. Production memakai Vercel + satu Supabase hosted project Singapore dengan migration-only workflow.
- Admin UI, provider email production, mandatory email verification, monitoring, backup/restore drill, dan formal production/accessibility verification tetap belum selesai. Recovery token/password-reset foundation sudah terverifikasi lokal dan dormant.
- Production single-project memakai migration-only workflow; reset dan destructive integration/pgTAP/E2E tetap disposable-local-only. Ikuti `docs/deployment/PRODUCTION_VERCEL_SUPABASE.md`.
- `docs/architecture/ADR-0001-phase-0-foundation.md` adalah catatan keputusan historis. Catatan lamanya tentang belum ada package lock tidak menggambarkan kondisi saat ini; `package-lock.json` kini ada.
- Jangan membaca atau mencetak `.env`, credential, token, key, atau secret.

## Child DOX Index

- [`src/AGENTS.md`](src/AGENTS.md): application, API, DB/auth, server boundary, UI, dan domain primitive guidance.
- [`tests/AGENTS.md`](tests/AGENTS.md): unit, integration, database, and browser test ownership.
- [`docs/AGENTS.md`](docs/AGENTS.md): product, architecture, security, QA, and AI tooling documentation guidance.
- [`supabase/AGENTS.md`](supabase/AGENTS.md): migration, seed, RLS, and pgTAP database contract.

# LensaDiri Agent Guide

Dokumen ini adalah kontrak kerja dan peta DOX tingkat root untuk coding agent dan contributor.

## Project Purpose

LensaDiri adalah platform eksplorasi kepribadian modular, privacy-first, dan mobile-first untuk pengguna Indonesia. Produk memberi lensa refleksi diri, bukan diagnosis klinis atau instrumen psikometri tervalidasi.

## Project State

- Status repository: **IN_PROGRESS**.
- Status peta DOX: **CURRENT**. Root map dan child DOX `src/`, `tests/`, `docs/`, serta `supabase/` mencerminkan baseline MVP lokal saat ini.
- Public landing, metode, privasi, disclaimer, auth UI, dashboard privacy, dan health endpoint tersedia.
- Internal auth mencakup register/login/logout, session HttpOnly, CSRF, rate limit, password Argon2id, dan hard-delete akun dengan re-authentication.
- MVP assessment lokal mencakup Quick 40 item dan Standard 60 item original, consent, autosave/resume, scoring trait deterministik, tiga overlay reflektif, private/account result, feedback, safe share, revoke, export JSON, dan delete result.
- Docker-backed Supabase reset, PostgreSQL integration test, pgTAP, dan Playwright desktop/mobile sudah terverifikasi lokal pada 2026-07-13.
- Hobby production baseline aktif di `https://lensadiri.vercel.app` dengan Supabase hosted Singapore; monitoring, backup/restore drill, custom domain, staging terpisah, admin UI, email verification, dan password reset belum selesai.

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
- `src/lib/scoring/likert.ts` dan `src/lib/scoring/profile.ts`: pure deterministic scoring primitives dan MVP profile engine.
- `supabase/migrations/`: foundation, account erasure, assessment/result, dan feedback schema; `supabase/seed/` memuat item bank lokal.

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

1. Baca `docs/product/PRD_FULL_LensaDiri.md`.
2. Identifikasi fase implementasi dan acceptance criteria yang sedang dikerjakan.
3. Jangan memperluas scope ke fitur V1/V2/V3 tanpa alasan yang terdokumentasi.
4. Pertahankan server sebagai sumber kebenaran untuk session, answer, scoring, dan result.

### Security invariants

- Jangan pernah menghitung skor primer di client.
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
npm run test:e2e           # run Playwright tests
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

Definition of done: requirement terpenuhi, input tervalidasi, error state aman, test relevan tersedia, aksesibilitas diperiksa, dokumentasi diperbarui, dan CI hijau.

## Known Constraints

- PRD adalah sumber kebutuhan produk dan blueprint target. Jangan menyamakan roadmap atau struktur target dengan kode yang sudah ada.
- Scoring MVP adalah trait-profile internal untuk refleksi, bukan instrumen psikometri tervalidasi formal.
- Item bank original saat ini hanya Bahasa Indonesia dan belum melewati validasi domain expert atau norming populasi.
- Database runtime lokal memakai Docker-backed Supabase. Production memakai Vercel + satu Supabase hosted project Singapore dengan migration-only workflow.
- Admin UI, email verification, password reset, monitoring, dan formal production verification tetap di luar baseline lokal saat ini.
- Production single-project memakai migration-only workflow; reset dan test destructive tetap local-only. Ikuti `docs/deployment/PRODUCTION_VERCEL_SUPABASE.md`.
- `docs/architecture/ADR-0001-phase-0-foundation.md` adalah catatan keputusan historis. Catatan lamanya tentang belum ada package lock tidak menggambarkan kondisi saat ini; `package-lock.json` kini ada.
- Jangan membaca atau mencetak `.env`, credential, token, key, atau secret.

## Child DOX Index

- [`src/AGENTS.md`](src/AGENTS.md): application, API, DB/auth, server boundary, UI, dan domain primitive guidance.
- [`tests/AGENTS.md`](tests/AGENTS.md): unit, integration, database, and browser test ownership.
- [`docs/AGENTS.md`](docs/AGENTS.md): product, architecture, security, QA, and AI tooling documentation guidance.
- [`supabase/AGENTS.md`](supabase/AGENTS.md): migration, seed, RLS, and pgTAP database contract.

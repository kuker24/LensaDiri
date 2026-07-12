# LensaDiri Agent Guide

Dokumen ini adalah kontrak kerja dan peta DOX tingkat root untuk coding agent dan contributor.

## Project Purpose

LensaDiri adalah platform eksplorasi kepribadian modular, privacy-first, dan mobile-first untuk pengguna Indonesia. Produk memberi lensa refleksi diri, bukan diagnosis klinis atau instrumen psikometri tervalidasi.

## Project State

- Status repository: **IN_PROGRESS**.
- Status peta DOX: **CURRENT**. Root map dan tiga child DOX saat ini terdokumentasi; fitur MVP lanjutan belum ada.
- Implementasi aktual: fondasi Phase 0 dengan public landing, halaman metode, privasi, disclaimer, preview mulai, security headers, primitive Likert deterministik, primitive token opaque, dan test unit serta smoke E2E.
- Proposal PRD: database, auth, registry modul, assessment persistence, scoring production, result, share, dan admin direncanakan pada fase berikutnya. Bagian tersebut belum merupakan implementasi aktual.

## Technology

- Next.js 16.2.10 App Router dan React 19.2.7.
- TypeScript strict, Tailwind CSS 4, ESLint, dan Prettier.
- Zod 4 untuk validasi boundary ketika diperlukan.
- Vitest untuk unit test dan Playwright untuk browser smoke test.
- GitHub Actions untuk quality gate.

## Entry Points

- `src/app/layout.tsx`: root layout, metadata, viewport, skip link, dan shared site chrome.
- `src/app/page.tsx`: landing page `/`.
- `src/app/method/page.tsx`, `src/app/privacy/page.tsx`, `src/app/disclaimer/page.tsx`, dan `src/app/start/page.tsx`: public information dan preview routes.
- `src/app/robots.ts` dan `src/app/sitemap.ts`: public crawl policy dan sitemap.
- `src/lib/scoring/likert.ts`: primitive scoring Likert deterministik; belum scoring engine production.
- `src/lib/security/tokens.ts`: generate, HMAC hash, dan constant-time verification token opaque.

## Repository Structure

```text
src/                 Next.js application, shared UI, dan domain primitives
  app/               App Router routes, metadata, dan global styles
  components/        Shared presentational components
  lib/               Site config, scoring, dan security primitives
tests/               Vitest unit tests dan Playwright browser smoke tests
docs/                Product requirements dan architecture decision record
.github/workflows/   CI workflows
```

Tidak ada `supabase/`, database client, internal auth, assessment persistence, result, atau admin implementation saat ini.

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
npm run dev           # Next.js development server
npm run build         # production build
npm run start         # serve production build
npm run lint          # ESLint, zero warnings
npm run lint:fix      # ESLint autofix
npm run typecheck     # Next type generation and TypeScript check
npm run format        # format repository with Prettier
npm run format:check  # verify Prettier formatting
npm test              # run Vitest once
npm run test:watch    # run Vitest in watch mode
npm run test:e2e      # run Playwright tests
npm run check         # lint, typecheck, unit test, and build
```

## Verification

Sebelum PR, wajib jalankan:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Untuk perubahan flow UI, wajib jalankan:

```bash
npm run test:e2e
```

Definition of done: requirement terpenuhi, input tervalidasi, error state aman, test relevan tersedia, aksesibilitas diperiksa, dokumentasi diperbarui, dan CI hijau.

## Known Constraints

- PRD adalah sumber kebutuhan produk dan blueprint target. Jangan menyamakan roadmap atau struktur target dengan kode yang sudah ada.
- Assessment belum aktif. Jangan menghubungkan UI awal ke data sensitif sebelum session storage, consent persistence, answer synchronization, dan authorization tersedia.
- Primitive Phase 0 belum menggantikan scoring engine production atau item bank original, versioned, dan auditable.
- `docs/architecture/ADR-0001-phase-0-foundation.md` adalah catatan keputusan historis. Catatan lamanya tentang belum ada package lock tidak menggambarkan kondisi saat ini; `package-lock.json` kini ada.
- Jangan membaca atau mencetak `.env`, credential, token, key, atau secret.

## Child DOX Index

- [`src/AGENTS.md`](src/AGENTS.md): application, UI, dan domain primitive guidance.
- [`tests/AGENTS.md`](tests/AGENTS.md): test ownership dan verification guidance.
- [`docs/AGENTS.md`](docs/AGENTS.md): product and architecture documentation guidance.

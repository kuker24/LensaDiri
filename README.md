# LensaDiri

LensaDiri adalah platform eksplorasi kepribadian modular, privacy-first, dan mobile-first untuk pengguna Indonesia.

> Kenali pola dirimu lewat banyak lensa.

## Status

Repository sudah memasuki **Phase 0: Repo Bootstrap**. Fondasi yang tersedia mencakup Next.js App Router, TypeScript strict, Tailwind CSS, linting, formatting, unit test, end-to-end test, security headers, dan CI.

Implementasi assessment, database, auth, scoring production, serta result privacy akan dilanjutkan bertahap sesuai PRD. Jangan menganggap UI awal sebagai instrumen psikometri yang sudah divalidasi.

## Prinsip yang tidak boleh dilanggar

- Scoring primer deterministik dan dijalankan di server.
- Hasil private secara default.
- Token sensitif disimpan dalam bentuk hash.
- AI tidak menghitung atau mengubah skor primer.
- Tidak ada klaim diagnosis, akurasi mutlak, testimonial palsu, atau angka pengguna palsu.
- Data jawaban dan hasil diperlakukan sebagai data sensitif.

## Menjalankan project

Persyaratan minimum:

- Node.js 20.9 atau lebih baru
- npm 10 atau lebih baru

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Atau jalankan pemeriksaan utama sekaligus:

```bash
npm run check
```

## Struktur utama

```text
src/app            Next.js routes dan public pages
src/components     Komponen UI bersama
src/lib/scoring    Primitive scoring deterministik
src/lib/security   Primitive token dan keamanan
tests/unit         Unit tests
tests/e2e          Browser smoke tests
docs/              PRD, keputusan arsitektur, keamanan, dan QA
```

## Dokumen

- [PRD lengkap](docs/product/PRD_FULL_LensaDiri.md)
- [ADR Phase 0](docs/architecture/ADR-0001-phase-0-foundation.md)
- [Panduan coding agent](AGENTS.md)

## Catatan ilmiah

LensaDiri adalah alat refleksi diri, bukan diagnosis klinis, pengganti tenaga profesional, atau dasar tunggal untuk keputusan pendidikan, pekerjaan, maupun relasi.

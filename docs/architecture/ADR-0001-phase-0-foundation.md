# ADR-0001: Phase 0 Application Foundation

- Status: Accepted
- Date: 2026-07-12
- Decision owners: LensaDiri maintainers

## Context

Repository awal hanya berisi README dan PRD. Implementasi perlu dimulai tanpa melompati prinsip privacy-first, deterministic scoring, scientific honesty, dan server-first architecture yang sudah ditetapkan.

## Decision

Phase 0 memakai:

- Next.js 16 App Router
- React 19
- TypeScript strict
- Tailwind CSS 4
- ESLint flat config
- Prettier
- Vitest untuk unit test
- Playwright untuk browser smoke test
- GitHub Actions untuk formatting, lint, typecheck, unit test, build, dan e2e

Public pages awal hanya berisi landing, metode, ringkasan privasi, disclaimer, dan preview mode assessment. Assessment tidak diaktifkan sebelum session storage, consent persistence, answer synchronization, dan authorization tersedia.

Primitive scoring dan token dibuat lebih awal karena keduanya merupakan invariant lintas fase. Primitive tersebut belum menjadi engine psikometri production dan belum memiliki item bank tervalidasi.

## Security baseline

- Global response headers menolak framing, MIME sniffing, dan permission browser yang tidak dibutuhkan.
- Token opaque minimal 128-bit, default 256-bit.
- Penyimpanan token menggunakan HMAC SHA-256 dengan pepper server-side.
- Private application routes dilarang pada robots policy sebagai defense in depth, bukan pengganti authorization.
- Tidak ada database credential atau service role key di client.

## Consequences

Positif:

- Fase berikutnya memiliki build, test, dan CI yang konsisten.
- Landing page sudah mengikuti positioning dan larangan klaim palsu.
- Security invariant terdokumentasi untuk coding agent berikutnya.
- Scoring dan token primitive dapat diuji sebelum terhubung ke database.

Trade-off:

- Belum ada assessment yang dapat diselesaikan pengguna.
- Belum ada package lock karena dependency installation tidak dijalankan dari environment authoring ini.
- Kebijakan privasi dan terms final tetap memerlukan review legal sebelum peluncuran.

## Follow-up

1. Hasilkan dan commit `package-lock.json` dari instalasi yang terverifikasi.
2. Implementasikan migration database dan RLS default deny.
3. Implementasikan internal auth, session cookie, CSRF, dan rate limiting.
4. Implementasikan module registry serta item bank original.
5. Implementasikan assessment session, autosave idempotent, dan atomic completion.

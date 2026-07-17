# LensaDiri

LensaDiri adalah platform eksplorasi kepribadian modular, privacy-first, dan mobile-first untuk pengguna Indonesia.

> Kenali pola dirimu lewat banyak lensa.

## Status

Phase 1 application foundation tersedia di repository:

- Migration PostgreSQL untuk akun, session, consent, rate limit, dan audit log.
- RLS forced default-deny serta pencabutan hak direct untuk role `anon` dan `authenticated`.
- Boundary PostgreSQL server-only, repository typed, transaction helper, dan environment validation dengan Zod.
- API internal auth: register, login, logout, dan session/CSRF bootstrap.
- Hash password Argon2id, token session opaque yang disimpan sebagai HMAC hash, CSRF, rate limit database, audit event, dan consent service.
- Unit, integration, dan pgTAP database test telah disiapkan.

Database runtime migration, integration test, dan pgTAP RLS test belum terverifikasi pada environment kerja saat ini karena Docker/local Supabase belum tersedia. Ini evidence environment saat ini, bukan batas permanen proyek. Jangan menganggap UI awal atau Phase 1 sebagai instrumen psikometri tervalidasi.

## Prinsip yang tidak boleh dilanggar

- Scoring primer deterministik dan dijalankan di server.
- Hasil private secara default.
- Token sensitif disimpan dalam bentuk hash atau keyed hash.
- AI tidak menghitung atau mengubah skor primer.
- Tidak ada klaim diagnosis, akurasi mutlak, testimonial palsu, atau angka pengguna palsu.
- Data jawaban dan hasil diperlakukan sebagai data sensitif.
- Browser tidak mendapat akses direct ke tabel Phase 1 atau credential database server.

## Prasyarat

- Node.js 22.x
- npm 10 atau lebih baru
- Docker Engine dengan Docker Compose untuk Supabase lokal, migration reset, integration test, dan pgTAP test
- Supabase CLI melalui `npx supabase` atau instalasi CLI lokal

## Konfigurasi lokal

Salin contoh environment. Nilai secret dalam contoh hanya placeholder; ganti lokal dan jangan commit `.env.local`.

```bash
cp .env.example .env.local
```

Buat tiap secret unik dengan minimal 32 karakter. Contoh generator lokal:

```bash
openssl rand -hex 32
```

Masukkan output berbeda untuk `AUTH_SESSION_SECRET`, `CSRF_SECRET`, `TOKEN_HASH_PEPPER`, dan `RATE_LIMIT_SECRET`. Jangan mencetak atau membagikan nilai yang dibuat.

Setelah Docker berjalan, mulai Supabase lokal dan reset database kosong dengan migration Phase 1:

```bash
npm run db:start
npm run db:reset
```

URL database lokal dalam `.env.example` memakai placeholder Supabase lokal:

```text
postgresql://postgres:<LOCAL_SUPABASE_DB_PASSWORD>@127.0.0.1:54322/postgres
```

Ganti placeholder dengan password database local yang Supabase CLI tampilkan saat start. Gunakan URL yang dihasilkan untuk `DATABASE_URL` dan `TEST_DATABASE_URL` hanya pada database lokal. Untuk menjalankan integration suite dalam shell yang sama:

```bash
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
```

`TEST_DATABASE_URL` hanya test database lokal tepercaya. Jangan arahkan test, migration reset, atau MCP development ke database production.

Jalankan aplikasi setelah environment dan database tersedia:

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Internal auth API dan CSRF

Tidak ada auth UI Phase 1. Client internal dapat memakai API berikut:

| Endpoint                  | Kontrak                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/auth/session`   | Membatasi request, mengembalikan status autentikasi dan `csrfToken`, serta memasang cookie nonce CSRF HttpOnly. Selalu panggil dulu sebelum mutation berbasis cookie.                      |
| `POST /api/auth/register` | Body JSON ketat: `email`, `password`, dan `redirectTo` internal opsional. Memerlukan exact `Origin` dan header `x-csrf-token`. Respons sukses selalu `202` untuk email baru atau duplikat. |
| `POST /api/auth/login`    | Body JSON ketat sama seperti register. Memerlukan CSRF. Kredensial salah mendapat respons generik `401`; sukses memasang cookie session HttpOnly.                                          |
| `POST /api/auth/logout`   | Memerlukan CSRF. Mencabut session bila ada lalu membersihkan cookie; token yang hilang atau sudah dicabut tetap aman untuk logout ulang.                                                   |

Semua respons auth memakai `Cache-Control: no-store`. Cookie memakai `HttpOnly`, `SameSite=Lax`, path `/`, dan `Secure` di production. Nama cookie menggunakan prefix `__Host-` di production. Mutation dari browser harus mengirim exact header `Origin` sama dengan `NEXT_PUBLIC_APP_URL` dan header `x-csrf-token` dari respons bootstrap. Tidak ada CORS bypass untuk flow ini.

API tidak menerima atau mengembalikan password maupun raw session token dalam JSON. `redirectTo` sudah divalidasi sebagai path internal, tetapi belum dipakai untuk redirect server pada Phase 1.

## Quality checks

Non-database checks:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Checks yang memerlukan Docker dan Supabase lokal aktif:

```bash
npm run db:reset
export TEST_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run test:db
```

Atau jalankan pemeriksaan aplikasi utama sekaligus:

```bash
npm run check
```

Lihat [Phase 1 verification](docs/qa/PHASE_1_VERIFICATION.md) untuk status evidence saat ini. Jangan menandai gate database lulus sebelum command lokal benar-benar selesai.

## Struktur utama

```text
src/app/api/auth    Route handler internal auth
src/lib/auth        Email, password Argon2id, dan session cookie
src/lib/db          Environment dan PostgreSQL client server-only
src/lib/security    Token HMAC, CSRF, HTTP, dan rate-limit primitive
src/server          Repository dan service trusted boundary
supabase/           Config, migration, seed, dan pgTAP test database
tests/unit          Unit test domain dan security primitive
tests/integration   Integration test PostgreSQL nyata
tests/e2e           Browser smoke test
docs/               PRD, ADR, security, QA, dan AI tooling
```

## Dokumen

- [PRD lengkap](docs/product/PRD_FULL_LensaDiri.md)
- [ADR Phase 0](docs/architecture/ADR-0001-phase-0-foundation.md)
- [Phase 1 auth security](docs/security/PHASE_1_AUTH.md)
- [Phase 1 verification](docs/qa/PHASE_1_VERIFICATION.md)
- [MCP setup](docs/ai/MCP_SETUP.md)
- [Panduan coding agent](AGENTS.md)

## Catatan ilmiah

LensaDiri adalah alat refleksi diri, bukan diagnosis klinis, pengganti tenaga profesional, atau dasar tunggal untuk keputusan pendidikan, pekerjaan, maupun relasi.

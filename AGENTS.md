# LensaDiri Agent Guide

Dokumen ini adalah kontrak kerja untuk coding agent dan contributor.

## Sebelum mengubah kode

1. Baca `docs/product/PRD_FULL_LensaDiri.md`.
2. Identifikasi fase implementasi dan acceptance criteria yang sedang dikerjakan.
3. Jangan memperluas scope ke fitur V1/V2/V3 tanpa alasan yang terdokumentasi.
4. Pertahankan server sebagai sumber kebenaran untuk session, answer, scoring, dan result.

## Security invariants

- Jangan pernah menghitung skor primer di client.
- Jangan pernah mengirim service role key, pepper, session secret, atau raw database credential ke client.
- Simpan session token, result token, dan share token sebagai hash atau keyed hash.
- Result selalu private kecuali pengguna melakukan aksi berbagi yang eksplisit.
- Endpoint sensitif harus fail closed.
- Jangan menaruh raw answer atau private result pada metadata, log, analytics, URL query, atau error message.
- Mutation wajib memakai validasi input, authorization, rate limit, dan proteksi CSRF yang sesuai.

## Scientific and content invariants

- Jangan memakai klaim diagnosis, akurasi mutlak, atau prediksi pasti.
- Jangan menyalin item instrumen proprietary.
- Tampilkan evidence tier dan batasan hasil.
- AI tidak boleh menghitung atau mengubah skor primer.
- Jangan membuat testimonial, jumlah pengguna, rating, atau bukti sosial palsu.

## Code standards

- TypeScript strict dan hindari `any`.
- Server Components menjadi default.
- Client Components hanya untuk interaksi yang memang membutuhkan browser state.
- Validasi boundary memakai Zod atau validator setara.
- Fungsi scoring harus pure, deterministic, versionable, dan memiliki unit test.
- Gunakan import alias `@/*`.
- Jaga aksesibilitas keyboard, label form, focus state, reduced motion, dan semantic HTML.

## Commands wajib sebelum PR

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Untuk perubahan flow UI:

```bash
npm run test:e2e
```

## Definition of done ringkas

Perubahan dianggap selesai bila requirement terpenuhi, input tervalidasi, error state aman, test relevan tersedia, aksesibilitas diperiksa, dokumentasi diperbarui, dan CI hijau.

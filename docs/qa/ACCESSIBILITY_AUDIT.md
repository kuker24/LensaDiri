# Accessibility Engineering Audit

## Target

Engineering baseline mengikuti WCAG 2.2 AA sebagai target desain. Dokumen ini bukan sertifikasi formal.

## Stable constraints untuk UI final

- Satu `h1` per route dan heading berurutan per section.
- Seluruh interactive control dapat dijalankan dengan keyboard dan memiliki visible focus.
- Target sentuh utama minimum 44 CSS pixel.
- Status save, error, progress, dan completion diumumkan melalui semantic role atau `aria-live`.
- Progress tidak bergantung pada warna saja dan memiliki label teks.
- Kontras warna memenuhi batas minimum WCAG AA: teks normal minimum 4.5:1, teks besar/bold minimum 3:1, dan elemen non-teks/focus ring minimum 3:1. Token khusus `--color-aperture-on-dark` (#f39257) digunakan untuk latar gelap (`bg-lens-strong`) dan `--color-warning` digelapkan ke `#91621e` untuk latar canvas.
- Form memakai label programmatic, error spesifik, serta tidak menghapus input pengguna saat gagal.
- Result chart memiliki nama aksesibel dan nilai teks.
- Diagnostics private tidak masuk shared DTO.
- Layout tidak menghasilkan horizontal overflow pada Desktop Chromium atau Pixel 5.
- Motion dekoratif tidak boleh menjadi satu-satunya cara menyampaikan state dan harus menghormati `prefers-reduced-motion`.
- Copy tidak mengklaim diagnosis atau kepastian identitas.

## Route coverage otomatis

`tests/e2e/accessibility.spec.ts` memeriksa:

- `/`
- `/modules`
- `/combos`
- `/about`
- `/contact`
- `/terms`
- `/blog`
- `/method`
- `/privacy`
- `/start`
- `/login`
- `/register`

Gate otomatis mencakup satu heading level 1, duplicate ID, image alt, nested interactive control, target utama minimum 44px, horizontal overflow desktop/mobile, keyboard focus, label auth, serta fixture Dialog nyata untuk focus containment, Escape, close control, unique ID, focus restoration, dan reduced motion.

Command:

```bash
npm run test:a11y
```

CI menjalankan command setelah database disposable di-reset dan feature fixture lokal diaktifkan.

## Assessment runner

- Likert menggunakan button dengan `aria-pressed` dan label angka plus teks.
- Autosave memakai `aria-live`.
- Pause/resume mempertahankan jawaban dan memberi state heading eksplisit.
- Segment progress menampilkan bagian aktif dan jumlah jawaban.
- Clarifier menyediakan previous/next, complete, dan skip dengan error `role=alert`.

## Result dan dashboard

- Confidence dan quality notice private diberi heading yang dapat dinavigasi.
- Bar score memiliki `role=img` dan label nilai dari 100.
- Dashboard menampilkan progress numerik selain progress bar.
- Resume dan result access merotasi opaque token melalui endpoint authenticated + CSRF.

## Manual review yang masih diperlukan

- Screen reader NVDA/JAWS/VoiceOver lintas browser: `BLOCKED_EXTERNAL`
- Review persepsi warna dan kontras oleh auditor manusia pada perangkat nyata: `BLOCKED_EXTERNAL`. Token kritis dan pasangan aperture pada surface gelap sudah memiliki gate otomatis.
- Cognitive walkthrough bersama pengguna neurodiverse: `BLOCKED_EXTERNAL`
- Bahasa Indonesia oleh accessibility reviewer: `BLOCKED_EXTERNAL`

Manual review tersebut wajib sebelum klaim konformitas formal, tetapi tidak mengubah contract route, DTO, keyboard, privacy, dan state yang sudah distabilkan untuk tahap desain.

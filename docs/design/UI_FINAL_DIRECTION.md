# LensaDiri — Final Visual Direction

Status: implementasi aktif pada branch `agent/final-ui-design`. Dokumen ini adalah kontrak visual untuk seluruh redesign UI. Perubahan pada dokumen ini harus diikuti perubahan implementasi yang sesuai, bukan sebaliknya.

## 1. Subjek dan audiens

LensaDiri adalah instrumen refleksi kepribadian multi-lensa: pengguna memilih satu atau beberapa "lensa" (Trait Profile, 16-Type, Enneagram, Temperament, dst), menjawab pertanyaan terstruktur, dan menerima laporan personal dengan tingkat keyakinan yang eksplisit — bukan ramalan, bukan diagnosis. Audiens: orang dewasa urban Indonesia yang mencari pemahaman diri, menghargai privasi, dan skeptis terhadap klaim psikometri berlebihan. Satu pekerjaan halaman utama: membuat pengguna percaya bahwa instrumen ini presisi, jujur soal batasnya, dan tidak buru-buru.

## 2. Konsep visual: Quiet Editorial Observatory

Ruang pengamatan yang tenang untuk mengamati pola diri sendiri — bukan formulir administrasi, bukan kuis hiburan, bukan dashboard korporat. Motif domain optik (lensa, fokus, spektrum, lapisan cahaya) muncul melalui komposisi dan detail interaksi, bukan ikon lensa ditempel di mana-mana.

Anti-pattern AI generik yang dihindari secara sadar (dan alasannya):
- **Bukan** cream `#F4F1EA` + serif kontras tinggi + aksen terracotta — default nomor satu AI, tidak berhubungan dengan domain optik/presisi.
- **Bukan** near-black + aksen neon tunggal — kesan gaming/crypto, bertentangan dengan karakter "tepercaya, tenang".
- **Bukan** broadsheet hairline-rule, radius nol, kolom koran padat — subjek bukan jurnalisme cetak, dan radius nol terasa keras untuk konteks refleksi personal.
- **Bukan** gradient ungu-ke-biru sebagai identitas, glassmorphism tanpa alasan, kartu di dalam kartu, pill untuk semua label, ikon dalam kotak rounded di atas tiap judul, hero-metric template (angka besar + gradient), numbered marker generik (01/02/03) tanpa isi yang benar-benar berurutan.

## 3. Token system

### Warna (4 peran inti + semantik)

Warna dideskripsikan sebagai peran, diimplementasikan sebagai CSS custom properties via Tailwind v4 `@theme` di `src/app/globals.css`. Skala neutral memakai OKLCH agar kontras konsisten lintas hue.

| Peran | Light | Deskripsi |
| --- | --- | --- |
| `canvas` | `#FAF8F4` (warm paper, bukan cream klise `#F4F1EA`) | Latar utama, bukan putih steril |
| `ink` | `#181511` (deep warm black, bukan `#000`) | Teks utama, kontras tinggi |
| `lens` (brand) | `#2B4A43` (deep teal-forest — warna kaca lensa optik terpakai, bukan biru korporat) | Identitas utama: CTA primer, link, focus ring |
| `aperture` (accent) | `#C4703F` (burnt amber terkontrol — cahaya lampu observatorium, bukan terracotta cream-look) | Aksen hangat terbatas: highlight, badge penting, growth actions |
| `mist` | `#EFEBE3` | Surface sekunder, card fill halus |
| `line` | `#DED7C9` | Border, divider |

Semantik (tidak menggantikan makna warna sebagai satu-satunya pembawa informasi — selalu didampingi ikon/teks):
- `success` `#3F6B4E`, `warning` `#B8863A`, `danger` `#A6392F`, `info` sama dengan `lens`.

Signature element: gradient radial sangat halus (`aperture` → transparent, opacity ≤ 8%) di belakang hero dan di belakang confidence ring pada result report — mensimulasikan cahaya lolos lewat lensa, dipakai **hanya** di dua tempat itu, tidak di seluruh halaman.

### Tipografi (2 peran + tabular)

- **Display**: `Fraunces` (variable, optical size axis) — serif humanist dengan karakter, dipakai *terbatas* (H1 hero, angka skor besar di result). Alasan: bukan sans generik, bukan serif kontras-tinggi editorial klise; Fraunces punya warmth tanpa jadi "cream+serif" trope karena dipasangkan dengan warna lensa/aperture, bukan terracotta.
- **UI/Body**: `Inter` (variable) — sudah jadi ekspektasi fallback di codebase, self-host via `next/font/google` agar benar-benar termuat (saat ini hanya string fallback, tidak pernah di-load). Dipakai untuk seluruh body text, form, navigasi.
- **Tabular**: `Inter` dengan `font-variant-numeric: tabular-nums` untuk skor, progres, tanggal, metadata numerik — konsisten lebar digit di seluruh laporan.
- Line-height body 1.6–1.7 untuk Bahasa Indonesia (lebih longgar dari default 1.5 Inter). Line-length target 60–70 karakter (`max-width: 68ch` untuk paragraf panjang di legal/method/blog).
- Uppercase hanya untuk label pendek (badge evidence tier, kicker section) dengan `letter-spacing: 0.06em`, ukuran kecil — tidak untuk heading.

### Spacing & radius

Skala 4px base: `1(4) 2(8) 3(12) 4(16) 6(24) 8(32) 12(48) 16(64) 24(96)`. Radius: `sm(6px)` kontrol kecil (input, badge), `md(10px)` kartu/surface, `lg(16px)` container besar/modal — sengaja kecil-sedang, bukan `rounded-2xl`/`rounded-3xl` generik yang sudah dipakai sekarang, dan bukan radius nol (broadsheet trope).

### Elevation

Shadow tunggal terkendali: `--shadow-surface` (blur besar, opacity sangat rendah, warna `ink` bukan hitam pekat) untuk card/dialog. Tidak ada multi-layer shadow stacking.

### Motion

Ringkasan dari `emil-design-eng` (detail penuh diterapkan Tahap 5): durasi UI ≤ 300ms, `ease-out` untuk enter, `ease-in-out` untuk transisi state, transform+opacity only, origin-aware untuk popover/dialog, `prefers-reduced-motion` → fade sederhana pengganti motion spasial. Assessment runner lebih restrained dari landing page.

## 4. Bahasa komponen

- **Surface policy**: satu level card (`mist` fill, `line` border, `radius-md`) untuk pengelompokan konten sejenis. Tidak ada card bersarang di dalam card. Section besar dipisah dengan ritme spasial (padding vertikal), bukan selalu dibungkus card.
- **Button**: primary (`lens` fill), secondary (outline `line`), ghost (teks saja) — tiga varian cukup, tidak lebih.
- **Badge**: dipakai jujur untuk evidence tier/status (published/draft/experimental), bentuk pill kecil dengan border, bukan fill warna mencolok.
- **Form control**: label selalu visible dan terhubung (`htmlFor`), bukan placeholder-as-label.
- **Progress**: garis tipis dengan fill `lens`, nilai teks eksplisit di sampingnya (bukan color-only).

## 5. Prinsip responsif

Mobile bukan desktop yang diperkecil — hierarki disusun ulang per breakpoint kunci (360×800, 390×844, 768×1024, 1280×800, 1440×900). Assessment runner dan Likert dioptimalkan untuk jempol (target sentuh ≥ 44px). Tabel perbandingan combo berubah jadi struktur bertumpuk di mobile, bukan scroll horizontal dipaksa.

## 6. Before / after

| Area | Sebelum | Sesudah |
| --- | --- | --- |
| Token | Tidak ada, warna Tailwind mentah (`violet-*`, `amber-*`) campur 10 CSS var ad hoc | `@theme` terpusat, seluruh warna/spacing/radius/motion by name |
| Font | Fallback string, Inter tidak pernah termuat | `next/font` self-hosted Inter + Fraunces terbatas |
| Primitives | Tidak ada `ui/` folder, semua komponen composite ad hoc | `src/components/ui/` primitives dipakai ulang lintas flow |
| Assessment runner | Progress bar manual, Likert button-list polos | Kontrol Likert matang, progress dengan motion purposeful, tetap radio semantics |
| Result report | Struktur lengkap tapi visual datar | Hierarki premium, anchor navigation, confidence bukan dekorasi |
| Motion | Tidak ada | Purposeful, sub-300ms, direview `review-animations` |

Field wajib §17.1/§17.2 dan safe-share allowlist §17.4 tidak berubah — dokumen ini murni lapisan visual.

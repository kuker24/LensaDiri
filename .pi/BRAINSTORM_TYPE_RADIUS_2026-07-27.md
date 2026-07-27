# Brainstorm — Tipografi & bentuk UI yang lebih lembut

**Tanggal:** 2026-07-27
**Status:** keputusan dikunci + diimplementasi (Soft Product)
**Scope:** frontend-only; monochrome Design2 tetap; backend frozen
**Pemicu:** pengguna merasa huruf kaku; tombol & UI terlalu petak/lancip

---

## Diagnosis singkat (kenapa terasa kaku)

| Sumber              | Keadaan sekarang                                      | Efek                                                                        |
| ------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- |
| **Tombol**          | `rounded-[2px]` + `font-mono` + **UPPERCASE**         | Baca seperti terminal/instrumentasi, bukan produk refleksi                  |
| **Radius token**    | sm/md/pill = **2px**, lg = 10px, container = 20px     | Kontrol interaktif “kotak tajam”; gallery MekaVerse, bukan soft product     |
| **Display/body**    | Inter saja, weight 400, `"liga" 0`                    | Netral-geometris; aman tapi dingin jika tanpa kontras humanis               |
| **Mono scope**      | JetBrains Mono di CTA, badge, nav micro, banyak label | Mono mendominasi chrome → kaku di seluruh flow                              |
| **Kontrak Design2** | MekaVerse: 2px control, mono chrome, flat void        | Sengaja “museum/terminal”; cocok game portal, kurang hangat untuk LensaDiri |

**Bukan bug teknis** — ini rasa _shape language_ + _type voice_ yang terlalu setia ke referensi MekaVerse.

Warna monokrom (void / bone / charcoal / frost / ash) **bisa tetap**. Yang digeser: huruf + radius + peran mono.

---

## Prinsip yang dipertahankan

1. Privacy-first, non-diagnostik, mobile-first, copy Indonesia.
2. Monokrom Design2 (tanpa aksen warna baru kecuali diminta).
3. Aksesibilitas: focus ring, min touch 44px, reduced-motion.
4. Mono tetap boleh untuk **data/meta** (skor, token ringkas, evidence code) — bukan untuk setiap CTA.
5. Perubahan lewat token pusat (`globals.css` radius + font) + komponen UI (`button`, `input`, `badge`, dialog/toast) agar konsisten.

---

## Tiga arah desain (pilih satu)

### A — _Soft Product_ (disarankan untuk “tidak kaku”)

**Rasa:** aplikasi refleksi modern Indonesia; tenang, ramah, tetap premium gelap.

| Layer              | Usulan                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Display + body** | **Plus Jakarta Sans** (Google Fonts; bagus untuk Latin/ID) _atau_ **DM Sans**                                      |
| **Mono**           | JetBrains Mono **hanya** meta/skor/evidence — **bukan** label tombol                                               |
| **Tombol**         | Sentence case (bukan ALL CAPS), font sans weight 500–600, tracking normal                                          |
| **Radius**         | control **10–12px**, input **10px**, card/panel **16px**, shell besar **20–24px**, badge **999px** (pill) opsional |
| **Hero**           | Line-height longgar (~0.95–1.05), bukan 0.78 monumental-kaku                                                       |

**Pro:** langsung meredakan “petak lancip”; cocok brand LensaDiri.
**Kontra:** menjauh dari literal Design2/MekaVerse; perlu update catatan Design2.

---

### B — _Warm Editorial_ (lebih berkarakter)

**Rasa:** refleksi + editorial lembut; sedikit “jurnal pribadi”.

| Layer       | Usulan                                                      |
| ----------- | ----------------------------------------------------------- |
| **Display** | **Lora** atau **Literata** (serif humanis) — hero & H1 saja |
| **Body/UI** | **Source Sans 3** atau **IBM Plex Sans**                    |
| **Mono**    | Meta saja                                                   |
| **Tombol**  | Sans medium, sentence case, radius **12px**                 |
| **Radius**  | control 12px, card 16–20px                                  |

**Pro:** paling “tidak kaku” secara emosional; kontras display/body.
**Kontra:** serif di dark UI butuh hati-hati (contrast, size); lebih banyak token type; Lora pernah di-remove di redesign — perlu sadar regress history.

---

### C — _Gallery Softened_ (paling dekat Design2)

**Rasa:** monokrom gallery tetap, hanya “dilembutkan”.

| Layer      | Usulan                                                        |
| ---------- | ------------------------------------------------------------- |
| **Font**   | Tetap **Inter** (+ opsional Inter display optical)            |
| **Mono**   | Nav/micro boleh mono; **CTA pindah ke Inter** + sentence case |
| **Radius** | control **8px** (bukan 2), card **12–16**, large **20**       |
| **Hero**   | Sedikit longgar line-height; keep weight 400                  |

**Pro:** minimal drift dari kontrak Design2; effort rendah.
**Kontra:** mungkin masih terasa agak kaku jika yang diinginkan benar-benar soft product.

---

## Matriks cepat

| Kriteria                      | A Soft Product | B Warm Editorial | C Gallery Softened |
| ----------------------------- | -------------- | ---------------- | ------------------ |
| Anti-kaku                     | ★★★★★          | ★★★★★            | ★★★☆☆              |
| Setia Design2 monokrom shell  | ★★★★☆          | ★★★☆☆            | ★★★★★              |
| Effort implementasi           | sedang         | sedang–tinggi    | rendah             |
| Risiko “bukan LensaDiri lagi” | rendah         | medium (serif)   | rendah             |
| Cocok privacy calm            | tinggi         | tinggi           | medium–tinggi      |

---

## Lingkup implementasi (setelah arah dipilih)

**Token / shell**

- `src/app/layout.tsx` — load font Google
- `src/app/globals.css` — `--font-*`, `--radius-*`, body features
- (opsional) `Design.md/Design2` note “adapted for product warmth”

**Komponen primitif (efek global besar)**

- `button.tsx` — radius, font family, casing
- `input.tsx` / textarea — radius
- `badge.tsx`, `dialog.tsx`, `toast.tsx`, `skeleton.tsx`, `progress.tsx`
- Header/footer brand wordmark weight/tracking

**Sweep class**

- `rounded-[2px]` → token / `rounded-md` baru di pages & forms
- `font-mono … uppercase` pada CTA → sans sentence-case
- Simpan mono di: evidence badge, tabular scores, technical chips

**Verifikasi**

- lint + typecheck
- smoke visual: `/`, `/start`, runner, result, auth
- e2e jika flow selector/copy tombol berubah assertion

**Out of scope**

- Warna brand baru, backend, AI narrative, skor, copy produk besar

---

## Keputusan yang dibutuhkan dari pemilik produk

1. **Arah:** A / B / C (atau hybrid, mis. A font + C radius).
2. **Tombol:** sentence case vs tetap uppercase (disarankan sentence case).
3. **Mono:** hanya meta, atau masih boleh di nav?
4. **Seberapa bulat:** 8px (halus) vs 12px (jelas soft) vs pill CTA.
5. **Apakah boleh update catatan Design2** sebagai “adapted product shell”?

---

## Rekomendasi facilitator

Untuk keluhan _“huruf kaku + petak sudut lancip”_ pada produk refleksi Indonesia:

→ **Arah A (Soft Product)**
→ Plus Jakarta Sans (display+UI)
→ JetBrains Mono hanya meta
→ control radius **12px**, panel **16px**, large **20px**
→ CTA sentence case, weight medium

## Keputusan terkunci (2026-07-27)

| Item           | Pilihan                                  |
| -------------- | ---------------------------------------- |
| Arah           | **A Soft Product**                       |
| Radius control | **12px** (panel 16px, shell 20px)        |
| CTA            | **Sentence case + sans**                 |
| Display/body   | **Plus Jakarta Sans**                    |
| Mono           | Meta/skor/evidence only (JetBrains Mono) |

### Implementasi (working tree)

- `layout.tsx` — `Plus_Jakarta_Sans` + JetBrains Mono
- `globals.css` — font tokens, radius sm/md/lg/xl/pill, nav-link sans, display line-height 0.95
- UI primitives — button/input/badge/dialog/toast/skeleton
- Sweep `rounded-[2px]`→`12px`, `rounded-[10px]`→`16px` across `src/`
- Header/footer wordmark + nav soft sans
- CTA links no longer mono+uppercase

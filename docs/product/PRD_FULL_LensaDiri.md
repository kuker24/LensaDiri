# PRD FULL LensaDiri

## 0. Kontrol Dokumen

| Field | Nilai |
| --- | --- |
| Versi | 2.0 |
| Status | Canonical product and engineering contract |
| Tanggal | 13 Juli 2026 |
| Repository | `kuker24/LensaDiri` |
| Produk | LensaDiri |
| Tagline | Kenali pola dirimu lewat banyak lensa |
| Platform utama | Web app mobile-first |
| Bahasa | Bahasa Indonesia sebagai default, English menyusul |
| Target stack | Next.js App Router, TypeScript strict, PostgreSQL melalui Supabase, Tailwind CSS, server-first architecture, internal auth |
| Production saat dokumen disusun | `https://lensadiri.vercel.app` |
| Production source checkpoint | Branch `agent/phase-1-foundation`, commit `867536aae81e0130de43576418d091c4d21e310f` |
| Pemilik keputusan produk | Maintainer LensaDiri |

Dokumen ini menggantikan PRD versi 1.0 sebagai sumber kebenaran utama untuk produk, backend, frontend, scoring, database, keamanan, QA, deployment, dan roadmap LensaDiri.

PRD ini membedakan dengan tegas:

1. **Target produk:** perilaku final yang wajib dicapai.
2. **Baseline production saat ini:** MVP transisi Quick 40 dan Standard 60 yang sudah berjalan.
3. **Rencana migrasi:** perubahan bertahap agar production mencapai target tanpa reset data dan tanpa merusak pengguna aktif.

Urutan prioritas proyek setelah dokumen ini disahkan:

1. Bekukan kontrak produk melalui PRD ini.
2. Perbaiki backend agar benar-benar modular.
3. Lengkapi frontend secara fungsional dengan desain minimal.
4. Pisahkan scoring setiap lensa dan bangun correlation engine.
5. Lengkapi mode Complex, combo, clarifier, dan multi-session.
6. Setelah semua alur lengkap dan stabil, ganti visual dengan desain final tanpa mengubah domain contract.

---

## 1. Ringkasan Eksekutif

LensaDiri adalah platform eksplorasi kepribadian modular untuk pengguna Indonesia. Pengguna tidak dipaksa mengerjakan satu paket tetap. Pengguna dapat:

- memilih satu lensa saja, misalnya 16-Type;
- memilih beberapa lensa sebagai combo, misalnya 16-Type + Enneagram;
- memilih preset combo yang direkomendasikan;
- memilih paket lengkap multi-lensa;
- memilih kedalaman Quick, Normal, atau Complex;
- menyimpan progres, melanjutkan sesi, melihat hasil private, membagikan hasil secara eksplisit, mengekspor data, dan menghapus data.

LensaDiri memakai **Big Five atau Trait Profile sebagai backbone evidence-oriented**, tetapi setiap lensa lain harus memiliki item dan scoring sendiri. Big Five tidak boleh digunakan untuk mengarang hasil Enneagram, 16-Type, Temperament, atau lensa lain. Hasil lintas lensa baru digabung setelah setiap modul selesai dihitung secara independen.

Produk tidak boleh diposisikan sebagai diagnosis, instrumen psikologi resmi, alat rekrutmen final, atau prediksi masa depan. LensaDiri adalah alat refleksi diri dengan scientific honesty, evidence tier yang terlihat, confidence yang transparan, dan kontrol privasi penuh.

Frontend awal harus **minimal tetapi lengkap secara fungsi**. Visual tidak perlu final. Seluruh route, form, state, validasi, accessibility, dan kontrol data harus tersedia agar desain baru dapat dipasang kemudian tanpa membangun ulang backend atau business logic.

---

## 2. Kondisi Production Saat Ini

Production checkpoint yang menjadi dasar migrasi telah memiliki:

- internal account registration dan login;
- Argon2id password hashing;
- HttpOnly session;
- logout dan dashboard private;
- permanent account deletion;
- consent;
- Quick 40 dan Standard 60;
- idempotent autosave dan resume;
- deterministic server-side scoring;
- private result;
- share dan revoke;
- JSON export;
- feedback;
- result deletion;
- 5 additive database migrations;
- 15 forced-RLS tables;
- 0 browser policies;
- GitHub Actions yang menjalankan quality, database, dan browser test;
- Vercel production dengan Supabase hosted Singapore.

Baseline tersebut merupakan **MVP transisi**, bukan implementasi final PRD 2.0.

Gap utama terhadap target final:

- mode baru hanya `quick` dan `standard`;
- public label Normal dan mode Complex belum tersedia;
- pemilihan satu lensa atau combo bebas belum tersedia;
- Test Composer belum tersedia;
- session blueprint belum mengunci komposisi modul secara lengkap;
- current overlay 16-Type, motivasi, dan temperament masih diturunkan dari trait utama;
- scoring independen per modul belum tersedia;
- jumlah soal final Normal 80–90 dan Complex 100–120 belum tersedia;
- clarifier 12–24 item belum tersedia;
- correlation engine lintas lensa belum tersedia;
- frontend baru mewakili alur MVP sederhana;
- email verification, password reset, staging, formal WCAG audit, dan validasi psikometrik belum selesai.

Migration ke PRD 2.0 wajib bersifat additive dan backward-compatible sejauh memungkinkan. Data production tidak boleh di-reset untuk mengejar struktur baru.

---

## 3. Latar Belakang dan Masalah

### 3.1 Masalah pengguna

Pengguna sering mengeluhkan tes kepribadian online karena:

- hasil terasa tidak cocok;
- tes singkat dipresentasikan seolah sama kuatnya dengan tes panjang;
- label diberikan terlalu mutlak;
- banyak tes tidak menjelaskan tingkat keyakinan hasil;
- pengguna tidak dapat memilih tes yang benar-benar ingin dikerjakan;
- paket terlalu panjang karena semua sistem digabung secara paksa;
- pertanyaan berulang dan melelahkan;
- hasil hanya berupa label tanpa penjelasan praktis;
- pengguna tidak memahami perbedaan tes evidence-oriented, reflektif, dan simbolis;
- data jawaban dan hasil tidak dikelola secara transparan.

### 3.2 Masalah produk

Produk harus menyeimbangkan:

- kredibilitas;
- kemudahan penggunaan;
- kedalaman hasil;
- kebebasan memilih modul;
- completion rate;
- viralitas dan shareability;
- privacy dan data control;
- maintainability engineering.

### 3.3 Masalah teknis yang harus dihindari

- Client menghitung atau mengirim skor final.
- Semua hasil tipe diturunkan dari satu skor trait.
- Sesi tidak mengunci versi modul dan item.
- Jawaban hilang karena retry atau race condition.
- Session completed tanpa result yang konsisten.
- Public result dapat dibaca langsung dari database.
- Token disimpan mentah.
- Share link tidak dapat dicabut.
- Metadata membocorkan hasil private.
- Mode panjang tidak memiliki autosave, resume, atau segmentasi.
- Frontend terlalu terikat pada desain tertentu sehingga perubahan UI merusak domain logic.
- Perubahan item bank mengubah hasil lama tanpa versioning.

---

## 4. Visi, Misi, dan Positioning

### 4.1 Visi

Menjadi platform self-discovery modular untuk memahami pola diri melalui banyak lensa secara jujur, personal, aman, dan actionable.

### 4.2 Misi

- Memberi pengguna kebebasan memilih lensa.
- Menjelaskan trade-off antara kecepatan dan kedalaman.
- Memisahkan evidence-oriented score, reflective typology, experimental module, dan cultural lens.
- Menghasilkan laporan lintas lensa tanpa mengunci identitas pengguna.
- Menjaga seluruh data sensitif private secara default.
- Membangun engine yang versioned, deterministic, repeatable, dan auditable.

### 4.3 Positioning publik

> LensaDiri membantu kamu memahami pola berpikir, motivasi, emosi, komunikasi, relasi, dan arah pengembangan diri melalui tes modular yang bisa kamu pilih sendiri.

### 4.4 Bukan positioning produk

LensaDiri bukan:

- MBTI resmi;
- tes psikologi klinis;
- diagnosis;
- alat seleksi kerja final;
- alat penentu pasangan;
- prediksi nasib atau masa depan;
- pengganti psikolog, psikiater, konselor, atau asesmen profesional;
- produk yang menjamin akurasi 100 persen.

---

## 5. Tujuan dan Non-Goals

### 5.1 Tujuan utama

- Mendukung single-lens test, custom combo, preset combo, dan full-spectrum test.
- Mendukung Quick, Normal, Complex, dan Clarifier.
- Menyusun item secara dinamis melalui Test Composer.
- Menghitung setiap modul secara independen.
- Menampilkan confidence dan response quality secara transparan.
- Menghasilkan report per modul dan report lintas lensa.
- Menjaga result private secara default.
- Menyediakan frontend minimal tetapi lengkap.
- Menyediakan admin dan seed tooling yang aman.
- Menyediakan test dan release pipeline yang reproducible.

### 5.2 Non-goals untuk fase implementasi berikutnya

- Visual final atau branding final.
- Diagnosis klinis.
- Adaptive testing berbasis IRT production sebelum data cukup.
- Marketplace psikolog.
- B2B hiring atau employee ranking.
- Payment kompleks.
- Public leaderboard.
- Chat AI bebas dengan raw answer tanpa consent.
- Klaim validasi formal sebelum studi psikometrik selesai.

---

## 6. Target Pengguna

### 6.1 Primary audience

Gen Z Indonesia sekitar 15–27 tahun yang:

- menggunakan mobile sebagai perangkat utama;
- tertarik self-discovery;
- ingin hasil visual dan mudah dipahami;
- ingin membandingkan beberapa lensa;
- ingin membagikan ringkasan aman;
- membutuhkan penjelasan yang tidak menghakimi.

### 6.2 Secondary audience

- Mahasiswa dan fresh graduate.
- Kreator konten self-growth.
- Komunitas pengembangan diri.
- Mentor dan fasilitator non-klinis.
- Pengguna yang fokus pada gaya belajar, kerja, relasi, atau komunikasi.

### 6.3 Persona utama

#### Persona A: Pengguna penasaran

Ingin mencoba satu tes populer dengan cepat. Memilih 16-Type Quick. Membutuhkan peringatan bahwa hasil masih berupa gambaran awal.

#### Persona B: Pengguna pembanding

Ingin combo 16-Type + Enneagram. Membutuhkan report per modul dan penjelasan hubungan keduanya.

#### Persona C: Pengguna serius

Memilih Complex multi-lensa. Membutuhkan autosave, multi-session, confidence, reflective tension, dan growth plan.

#### Persona D: Pengguna fokus karier

Memilih Trait Profile + RIASEC. Membutuhkan insight gaya kerja dan minat, tanpa klaim penentu karier mutlak.

#### Persona E: Admin konten

Mengelola module version, item bank, translations, blueprint, scoring version, report template, dan audit log tanpa membuka raw private result secara bebas.

---

## 7. Prinsip Produk yang Tidak Boleh Dilanggar

1. **Modular by design.** Pengguna memilih lensa, bukan menerima semua lensa secara paksa.
2. **Independent scoring.** Setiap lensa memiliki item dan scoring sendiri.
3. **Server authoritative.** Sesi, item, jawaban, scoring, result, dan share dikendalikan server.
4. **Deterministic scoring.** Input dan versi sama harus menghasilkan skor sama.
5. **Private by default.** Result tidak publik tanpa aksi eksplisit.
6. **Scientific honesty.** Evidence tier, batasan, dan status validasi terlihat.
7. **No proprietary misuse.** Nama dan item proprietary tidak disalin atau diklaim resmi.
8. **Confidence, not certainty.** Sistem menjelaskan keyakinan hasil, bukan kepastian identitas.
9. **Actionable.** Report memberi langkah nyata.
10. **Mobile-first.** Semua flow utama nyaman pada layar kecil.
11. **Accessible.** Target WCAG 2.2 AA.
12. **No fake trust.** Tidak ada testimonial, rating, angka pengguna, atau badge palsu.
13. **Fail closed.** Error authorization atau privacy harus menolak akses.
14. **Data minimization.** Hanya data yang diperlukan yang disimpan.
15. **Design replaceable.** UI visual boleh diganti tanpa mengubah domain dan API contract.

---

## 8. Scientific, Legal, dan Brand Guardrails

### 8.1 Istilah aman

Gunakan nama publik:

- Trait Profile atau Big Five-informed Trait Profile.
- Jungian-inspired 16-Type.
- Enneagram-inspired Motivation Lens.
- Three-Center Pattern.
- Temperament Lens.
- Instinctual Variant Lens.
- Socionics-inspired Communication Lens.
- RIASEC Career Interest Lens.
- Attachment Reflection Lens.
- Psychosophy Experimental Lens.
- Symbolic atau Cultural Lens.

Istilah “MBTI” hanya boleh dipakai sebagai alias pencarian atau penjelasan familiar seperti “sering dikenal pengguna sebagai tes MBTI”, disertai penegasan bahwa LensaDiri bukan instrumen MBTI resmi.

### 8.2 Klaim yang dilarang

- Akurat 100%.
- Tes psikologi resmi.
- Diagnosis kepribadian.
- Tipe kamu pasti.
- Cocok untuk rekrutmen.
- Menentukan pasangan terbaik.
- Memprediksi masa depan.
- Setara asesmen psikolog profesional.

### 8.3 Klaim yang diperbolehkan

- Membantu refleksi diri.
- Menggambarkan kecenderungan jawaban saat ini.
- Scoring primer bersifat deterministic dan versioned.
- Mode lebih dalam mengukur lebih banyak dimensi dan konsistensi.
- Hasil perlu dipahami sebagai gambaran, bukan batasan.

### 8.4 Originality

- Seluruh item wajib original.
- Item tidak boleh menyalin instrumen komersial atau proprietary.
- Setiap item harus memiliki construct note, polarity, weight, locale, dan review status.
- Item harus direview untuk bahasa, bias budaya, sensitivitas usia, dan keterbacaan.

---

## 9. Evidence Tier

| Tier | Posisi | Contoh |
| --- | --- | --- |
| A | Evidence-oriented psychometric layer | Trait Profile, Big Five, SLOAN |
| B | Question-based reflective typology | 16-Type, Enneagram, Three-Center, Temperament, Instinctual Variant, RIASEC, Attachment |
| B/Experimental | Reflective communication model dengan validasi terbatas | Socionics-inspired |
| Experimental | Modul eksploratif, tidak masuk klaim utama | Psychosophy |
| C | Cultural atau symbolic reflection only | Golongan darah, angka atau tanggal lahir, symbolic 9-Type |

Tier harus terlihat pada module selection dan result. Tier C tidak boleh digabung ke overall psychometric confidence.

---

## 10. Canonical Module Catalog

### 10.1 Core assessment catalog

#### 1. Trait Profile: Big Five + SLOAN

- Tier: A.
- Peran: backbone evidence-oriented.
- Output: lima trait, facet bila tersedia, percentile internal setelah norming, confidence band, dan SLOAN summary.
- Tidak menghasilkan overlay lain secara otomatis.

#### 2. Jungian-inspired 16-Type

- Tier: B.
- Output: empat dimension score, type tendency, alternate type, ambiguity, dan function-style narrative bila tervalidasi secara internal.
- Bukan MBTI resmi.

#### 3. Enneagram-inspired Motivation Lens

- Tier: B.
- Output: score sembilan pola, core tendency, wing, center, ambiguity, dan motivation narrative.

#### 4. Three-Center Pattern

- Tier: B.
- Output: satu pola dominan dari head, heart, dan gut serta hubungan antarpusat.
- Gunakan nama generik, bukan klaim produk proprietary.

#### 5. Temperament Lens

- Tier: B.
- Output: komposisi temperament, primary-secondary pattern, energy, pace, dan emotional expression.

#### 6. Instinctual Variant Lens

- Tier: B.
- Output: self-preservation, social, dan one-to-one tendency.
- Bisa standalone, tetapi report lebih bermakna bila dikombinasikan dengan Enneagram.

#### 7. Socionics-inspired Communication Lens

- Tier: B/Experimental.
- Output: information-processing dan interaction preferences.
- Tidak boleh mengklaim Socionics resmi.

#### 8. RIASEC Career Interest Lens

- Tier: B.
- Output: enam interest dimensions dan contoh lingkungan belajar/kerja.
- Bukan penentu karier mutlak.

#### 9. Attachment Reflection Lens

- Tier: B.
- Output: kecenderungan attachment dalam konteks relasi.
- Harus memakai disclaimer non-klinis dan bahasa hati-hati.

#### 10. Psychosophy Experimental Lens

- Tier: Experimental.
- Output hanya reflektif.
- Tidak masuk overall evidence-oriented summary.

### 10.2 Optional cultural catalog

#### Blood Type Cultural Lens

- Tier: C.
- Input dapat berupa pertanyaan atau data pilihan pengguna.
- Tidak boleh mengklaim hubungan biologis atau ilmiah dengan kepribadian.

#### Symbolic 9-Type atau Date Lens

- Tier: C.
- Fun reflection only.
- Dipisahkan visual dan naratif dari hasil psikometrik.

### 10.3 Module availability

Setiap modul memiliki status:

- draft;
- pilot;
- published;
- paused;
- retired;
- experimental.

Module selection hanya menampilkan modul `published`, `pilot` yang diizinkan, atau `experimental` dengan consent khusus.

---

## 11. Model Pemilihan Tes

### 11.1 Single Lens

Pengguna memilih satu modul saja.

Contoh:

- hanya 16-Type;
- hanya Big Five;
- hanya Enneagram;
- hanya RIASEC.

Hasil hanya menampilkan modul tersebut dan konteks yang relevan. Sistem tidak boleh mengarang modul lain dari score modul yang dipilih.

### 11.2 Custom Combo

Pengguna memilih dua atau lebih modul secara bebas.

Contoh:

- 16-Type + Enneagram;
- Big Five + 16-Type + Enneagram;
- Enneagram + Instinctual Variant + Temperament;
- Big Five + RIASEC;
- 16-Type + Socionics-inspired.

Sistem menampilkan estimasi item, durasi, evidence mix, dan kemungkinan segmentasi sebelum pengguna memberi consent.

### 11.3 Curated Combo Presets

Preset awal:

| Preset | Modul | Tujuan |
| --- | --- | --- |
| Kenali Pola Dasar | Trait Profile + 16-Type | Gaya umum berpikir dan berperilaku |
| Motivasi dan Relasi | Enneagram + Instinctual Variant + Attachment | Dorongan dan pola kedekatan |
| Belajar dan Karier | Trait Profile + RIASEC + 16-Type | Gaya belajar dan lingkungan kerja |
| Komunikasi | 16-Type + Temperament + Socionics-inspired | Cara memproses dan menyampaikan informasi |
| Deep Self-Discovery | Trait Profile + 16-Type + Enneagram + Three-Center + Temperament + Instinctual Variant | Laporan mendalam multi-lensa |

Preset adalah convenience layer. Di database, preset tetap menjadi daftar module version yang eksplisit.

### 11.4 Full Spectrum

Pengguna memilih seluruh modul yang tersedia dan kompatibel. Bila jumlah item melebihi batas sesi, Test Composer membagi assessment menjadi beberapa segment atau session part.

### 11.5 Compatibility and dependency rules

- Instinctual Variant boleh standalone, tetapi UI merekomendasikan Enneagram.
- Three-Center Pattern membutuhkan item sendiri dan tidak boleh hanya mengambil tiga score Enneagram tanpa blueprint yang tervalidasi.
- Cultural Lens tidak memengaruhi core confidence.
- Experimental Lens tidak dimasukkan ke overall validated summary.
- Retired module version tetap dapat membaca hasil lama tetapi tidak dapat dipilih untuk sesi baru.

---

## 12. Mode Kedalaman Tes

Nama publik:

- Quick;
- Normal;
- Complex.

Nama internal untuk backward compatibility:

- `quick`;
- `standard` untuk public label Normal;
- `deep` untuk public label Complex.

### 12.1 Target pengalaman

| Mode | Target item keseluruhan | Estimasi durasi | Posisi |
| --- | ---: | ---: | --- |
| Quick | 50–60 | 6–10 menit | Gambaran awal |
| Normal | 80–90 | 12–18 menit | Pilihan utama yang seimbang |
| Complex | 100–120 | 20–30 menit | Hasil paling mendalam |
| Clarifier | tambahan 12–24 bila perlu | 3–7 menit | Memperjelas skor ambigu |

Jumlah item bersifat dinamis. Single lens dapat memiliki item lebih sedikit dibanding combo. Target di atas adalah target pengalaman keseluruhan, bukan angka wajib setiap modul.

### 12.2 Contoh komposisi dinamis

| Pilihan | Quick | Normal | Complex |
| --- | ---: | ---: | ---: |
| 16-Type saja | 30–40 | 50–70 | 80–100 |
| Enneagram saja | 36–45 | 60–75 | 90–110 |
| 16-Type + Enneagram | 50–60 | 80–90 | 105–120 |
| Trait + 16-Type + Enneagram | 55–60 | 85–90 | 110–120 |
| Full Spectrum | 60 per segment | 90 per segment | 120 per segment |

Angka final ditentukan oleh module blueprint, item coverage, overlap, dan validation data.

### 12.3 Penjelasan tingkat ketelitian kepada pengguna

Sebelum validasi formal selesai, persentase berikut hanya boleh ditampilkan sebagai **perkiraan internal**, bukan akurasi ilmiah:

| Mode | Perkiraan ketelitian internal | Alasan |
| --- | ---: | --- |
| Quick | 60–70% | Item lebih sedikit, coverage lebih dangkal, pengaruh satu jawaban lebih besar |
| Normal | 75–85% | Coverage dan pemeriksaan konsistensi lebih baik |
| Complex | 85–92% | Lebih banyak facet, pasangan konsistensi, dan analisis lintas lensa |

Aturan wajib:

- Label harus berbunyi “perkiraan ketelitian internal” atau “tingkat kedalaman hasil”.
- Harus ada catatan bahwa angka belum merupakan validasi ilmiah formal.
- Persentase dapat disembunyikan melalui feature flag sampai pilot data cukup.
- Confidence aktual dihitung setelah pengguna selesai.
- Complex tidak otomatis mendapat confidence tinggi bila jawaban terlalu cepat, tidak konsisten, atau straightlining.
- Setelah pilot dan validation study, angka marketing harus diganti oleh metrik yang benar-benar dihitung.

Copy rekomendasi:

> Semakin lengkap tes yang kamu pilih, semakin banyak pola dan lapisan yang dapat diperiksa. Hasil tetap merupakan alat refleksi diri, bukan diagnosis atau penilaian mutlak.

### 12.4 Clarifier

Clarifier dipicu bila:

- dua score utama sangat berdekatan;
- dimension berada dekat threshold;
- contradictory item pair tidak konsisten;
- response quality rendah;
- module confidence di bawah batas;
- dua kandidat tipe memiliki score hampir sama.

Pengguna boleh melanjutkan atau melewati clarifier. Bila dilewati, result tetap tersedia dengan confidence lebih rendah dan penjelasan yang jujur.

---

## 13. Test Composer

Test Composer adalah server-side service yang menyusun assessment blueprint.

### 13.1 Input

- selected module keys;
- selected module versions;
- mode;
- locale;
- user age gate bila relevan;
- preset key bila digunakan;
- prior completed modules bila pengguna mengizinkan reuse;
- item exclusion dan exposure rules;
- composer version.

### 13.2 Output

- immutable assessment blueprint ID;
- ordered question list atau section list;
- module quotas;
- construct dan facet coverage;
- expected item count;
- expected duration;
- reverse-item distribution;
- attention dan consistency pair metadata;
- segment plan bila lebih dari satu part;
- scoring version per module;
- report template version.

### 13.3 Composition rules

- Item hanya berasal dari module version yang dipilih.
- Setiap construct minimum coverage harus terpenuhi.
- Pertanyaan duplikat atau sangat mirip harus dikurangi.
- Cross-module overlap hanya boleh digunakan bila item secara eksplisit dimapping ke beberapa construct dan scoring telah direview.
- Reverse-coded item harus seimbang dan tidak membingungkan.
- Tidak boleh lebih dari 120 item dalam satu active segment.
- Pertanyaan sensitif harus dibatasi dan memiliki helper text bila perlu.
- Urutan item dapat diacak secara deterministic berdasarkan blueprint seed.
- Blueprint tidak boleh berubah setelah sesi dimulai.
- Perubahan item bank tidak boleh mengubah sesi aktif atau result lama.

### 13.4 Multi-session

Bila assessment terlalu panjang:

- sistem membagi menjadi beberapa part;
- progres total dan progres part terlihat;
- setiap part dapat diselesaikan terpisah;
- autosave tetap aktif;
- result final baru dihitung setelah module requirement terpenuhi;
- partial module result hanya ditampilkan bila product rule mengizinkan.

---

## 14. Core User Flow

```text
Landing
→ pilih masuk sebagai guest atau akun
→ pilih single lens, custom combo, preset, atau full spectrum
→ pilih Quick, Normal, atau Complex
→ lihat jumlah soal, durasi, evidence tier, dan perkiraan kedalaman
→ consent
→ server membuat immutable blueprint dan session token
→ pengguna mengerjakan per section dengan autosave
→ resume bila terputus
→ completion validation
→ clarifier bila diperlukan
→ atomic server-side scoring per module
→ correlation engine menyusun cross-lens interpretation
→ private report
→ share, export, feedback, retest, atau delete
```

### 14.1 Guest flow

- Guest dapat memulai tanpa akun.
- Session dan result diakses dengan opaque token.
- Token hanya disimpan sebagai HMAC hash.
- Guest dapat membuat akun untuk claim result bila consent memungkinkan.
- Retention dijelaskan sebelum tes.

### 14.2 Account flow

- Result otomatis terhubung ke akun.
- Dashboard menampilkan sessions dan results.
- Pengguna dapat revoke session, export data, delete result, dan delete account.
- Email verification dan password reset menjadi release requirement sebelum public scale besar.

---

## 15. Scoring Architecture

### 15.1 Aturan utama

- Scoring hanya di server.
- Client hanya mengirim jawaban mentah dan metadata terbatas.
- Setiap module memiliki scoring strategy dan version sendiri.
- Setiap result menyimpan module version, scoring version, blueprint version, dan content version.
- AI tidak menghitung atau mengubah score primer.
- Completion dan result creation harus atomic.

### 15.2 Independent module scoring

Dilarang:

- menghasilkan 16-Type hanya dari Big Five threshold;
- menghasilkan Enneagram dari trait dominan;
- menghasilkan Temperament hanya dari extraversion dan emotional sensitivity;
- menghasilkan modul yang tidak dipilih pengguna;
- menyamakan correlation narrative dengan score primer.

Diperbolehkan:

- memakai Trait Profile sebagai konteks setelah semua modul dihitung independen;
- membandingkan score lintas modul;
- membuat narrative tension berdasarkan score read-only;
- menggunakan AI untuk variasi bahasa dari template terkontrol setelah score final tersedia dan consent AI diberikan.

### 15.3 Likert dan normalization

Default Likert:

1. Sangat tidak sesuai.
2. Tidak sesuai.
3. Netral atau kadang sesuai.
4. Sesuai.
5. Sangat sesuai.

Reverse coding:

```ts
scoredValue = 6 - rawValue;
```

Weighted module score dinormalisasi ke 0–100 sesuai scoring strategy yang versioned.

### 15.4 Module confidence

Module confidence mempertimbangkan:

- coverage item;
- completion;
- distance from decision boundary;
- internal consistency;
- response time;
- straightlining;
- contradiction pair;
- skipped optional item;
- clarifier completion;
- item quality weight;
- mode depth.

### 15.5 Overall confidence

Overall confidence bukan rata-rata buta seluruh modul. Sistem harus:

- memisahkan Tier A, Tier B, Experimental, dan Tier C;
- menghitung confidence per module;
- menampilkan weakest-link warning bila satu modul rendah;
- tidak memasukkan Tier C ke confidence psikometrik;
- menjelaskan bila combo memiliki mixed confidence.

### 15.6 Response quality flags

- `too_fast`;
- `straightlining`;
- `inconsistent_pair`;
- `low_attention`;
- `incomplete_optional`;
- `ambiguous_profile`;
- `high_skip_rate`;
- `session_fragmented`;
- `clarifier_skipped`.

Flags digunakan untuk penjelasan, bukan hukuman atau label negatif.

---

## 16. Correlation dan Reflective Tension Engine

Correlation engine bekerja setelah score primer final.

### 16.1 Tujuan

- Menjelaskan pola yang sejalan.
- Menjelaskan pola yang tampak bertentangan.
- Menunjukkan konteks, bukan memilih satu label sebagai kebenaran mutlak.
- Menghasilkan cross-lens strengths, blind spots, communication, dan growth suggestions.

### 16.2 Output

- aligned patterns;
- reflective tensions;
- context hypothesis;
- cross-lens confidence;
- report content keys;
- safe public summary.

### 16.3 Contoh tension

> Energi sosialmu cenderung rendah pada Trait Profile, tetapi lensa komunikasi menunjukkan kamu dapat sangat ekspresif ketika topiknya bermakna atau lingkungannya terasa aman.

### 16.4 Guardrails

- Narrative tidak boleh mengubah score.
- Tidak boleh membuat diagnosis.
- Tidak boleh menyimpulkan trauma atau kondisi medis.
- Hypothesis harus memakai kata seperti “cenderung”, “bisa jadi”, atau “dalam konteks tertentu”.
- AI output, bila digunakan, harus berasal dari structured DTO dan template safety.

---

## 17. Result Architecture

### 17.1 Result per module

Setiap module section minimal memiliki:

- module name dan evidence tier;
- score atau type tendency;
- confidence;
- ambiguity atau alternate candidate;
- penjelasan singkat;
- strengths;
- blind spots;
- practical reflection;
- limitation note.

### 17.2 Integrated report

Urutan report:

1. Hero summary.
2. Mode, selected lenses, completion date, dan scoring versions.
3. Confidence dan response quality explanation.
4. Core Trait Profile bila dipilih.
5. Result tiap module.
6. Aligned patterns.
7. Reflective tensions.
8. Communication style.
9. Learning and work style.
10. Relationship reflection.
11. Stress pattern.
12. Growth plan 7 hari.
13. Growth plan 30 hari bila entitlement tersedia.
14. Share card.
15. Privacy controls.
16. Export, feedback, retest, dan delete.

### 17.3 Tone

- Hangat.
- Natural Bahasa Indonesia.
- Tidak menghakimi.
- Tidak absolut.
- Actionable.
- Semi-playful pada bagian ringan.
- Profesional pada disclaimer dan privacy.

### 17.4 Safe public DTO

Public share tidak boleh memuat:

- raw answer;
- email;
- internal ID;
- exact response time;
- private quality flags;
- deleted atau revoked data;
- content yang di luar share scope.

---

## 18. Functional Requirements

### 18.1 Landing dan edukasi

- Menjelaskan modularity.
- Menjelaskan single, combo, dan full spectrum.
- Menjelaskan Quick, Normal, dan Complex.
- Menampilkan metode dan evidence tier.
- Tidak menggunakan fake social proof.
- CTA menuju module selection.

### 18.2 Module selection

- User dapat memilih satu atau beberapa module.
- Setiap card memiliki evidence tier, description, status, estimated duration, dan availability.
- UI menampilkan compatibility recommendation.
- User dapat memilih preset.
- Selection summary selalu terlihat sebelum lanjut.

### 18.3 Mode selection

- Menampilkan item estimate dan duration berdasarkan selection aktual.
- Menjelaskan trade-off kecepatan dan kedalaman.
- Menampilkan provisional precision hanya sesuai guardrail.
- Normal ditandai recommended.
- Complex menjelaskan autosave dan kemungkinan multi-session.

### 18.4 Consent

- Menjelaskan purpose, storage, retention, private default, sharing, dan limitation.
- Consent version disimpan.
- Optional research, marketing, dan AI consent terpisah.
- User dapat menolak optional consent tanpa kehilangan core test.

### 18.5 Test runner

- Satu pertanyaan per layar atau batch kecil.
- Progress part dan total.
- Previous, next, keyboard shortcuts, screen-reader labels.
- Autosave status.
- Resume.
- Safe network retry.
- Section break untuk test panjang.
- Pause and continue.
- Error tidak membocorkan internal detail.

### 18.6 Completion

- Server memvalidasi session, blueprint, question ownership, completeness, dan status.
- Score dibuat dalam transaction.
- Session completed hanya bila result berhasil dibuat.
- Idempotent retry mengembalikan result yang sama.

### 18.7 Dashboard

- Active sessions.
- Completed results.
- Selected modules dan mode.
- Resume action.
- Privacy settings.
- Export.
- Delete result.
- Delete account.
- Retest history pada fase lanjutan.

### 18.8 Sharing

- Explicit share creation.
- Scope: `card_only`, `public_preview`, atau `full_private_link`.
- Expiration.
- Revocation.
- Rotation.
- Generic metadata bila token invalid.

### 18.9 Feedback

- Rating 1–5.
- Optional message.
- Rate limited.
- Safe origin metadata.
- Tidak ada direct browser table insert.

---

## 19. Information Architecture

### 19.1 Public

- `/`
- `/method`
- `/modules`
- `/modules/[key]`
- `/combos`
- `/privacy`
- `/terms`
- `/disclaimer`
- `/about`
- `/contact`
- `/blog`
- `/blog/[slug]`

### 19.2 Auth

- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/logout`

### 19.3 Assessment

- `/start`
- `/start/modules`
- `/start/combos`
- `/start/mode`
- `/start/review`
- `/start/consent`
- `/test/[sessionToken]`
- `/test/[sessionToken]/pause`
- `/test/[sessionToken]/clarifier`
- `/test/[sessionToken]/complete`

### 19.4 Result

- `/result/[resultToken]`
- `/result/[resultToken]/module/[moduleKey]`
- `/result/[resultToken]/share`
- `/result/[resultToken]/privacy`
- `/result/[resultToken]/export`

### 19.5 Dashboard

- `/dashboard`
- `/dashboard/sessions`
- `/dashboard/results`
- `/dashboard/results/[id]`
- `/dashboard/privacy`
- `/dashboard/settings`
- `/dashboard/delete-account`

### 19.6 Admin

- `/admin`
- `/admin/modules`
- `/admin/module-versions`
- `/admin/questions`
- `/admin/blueprints`
- `/admin/combo-presets`
- `/admin/scoring-versions`
- `/admin/content`
- `/admin/feedback`
- `/admin/audit-logs`

---

## 20. Backend Contract

### 20.1 Architecture

- Next.js Server Components untuk read flow.
- Route Handlers atau server actions untuk trusted mutation.
- PostgreSQL sebagai source of truth.
- Server-only database client.
- Zod validation pada boundary.
- Domain services terpisah dari route dan UI.
- Transaction untuk completion dan destructive operation.
- Typed DTO untuk client.

### 20.2 Required domain services

- Module Registry Service.
- Combo Preset Service.
- Assessment Blueprint Composer.
- Session Service.
- Answer Sync Service.
- Module Scoring Service.
- Clarifier Service.
- Correlation Engine.
- Report Assembly Service.
- Share Service.
- Privacy and Deletion Service.
- Export Service.
- Feedback Service.
- Audit Service.

### 20.3 API target

#### Public catalog

- `GET /api/modules`
- `GET /api/modules/:key`
- `GET /api/combos`
- `POST /api/assessment/estimate`

#### Assessment

- `POST /api/assessment/start`
- `GET /api/assessment/:sessionToken`
- `PUT /api/assessment/:sessionToken/answers`
- `POST /api/assessment/:sessionToken/pause`
- `POST /api/assessment/:sessionToken/complete`
- `POST /api/assessment/:sessionToken/clarifier/start`
- `POST /api/assessment/:sessionToken/clarifier/complete`

Start request minimal:

```json
{
  "mode": "standard",
  "selectedModules": ["trait-profile", "type-16", "enneagram"],
  "comboPreset": null,
  "locale": "id",
  "consent": {
    "assessmentProcessing": true,
    "resultStorage": true,
    "researchOptional": false,
    "aiFeatureOptional": false
  }
}
```

#### Results

- `GET /api/results/:resultToken`
- `GET /api/results/:resultToken/modules/:moduleKey`
- `POST /api/results/:resultToken/share`
- `DELETE /api/results/:resultToken/share/:shareId`
- `GET /api/results/:resultToken/export`
- `DELETE /api/results/:resultToken`
- `POST /api/feedback`

#### Auth and account

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `DELETE /api/account`

### 20.4 Backward compatibility

Current endpoints boleh dipertahankan sementara sebagai adapter. Endpoint baru harus mengarah ke domain service yang sama. Migration tidak boleh membuat result Quick 40 atau Standard 60 lama tidak dapat dibaca.

---

## 21. Data Model Target

### 21.1 Existing domains yang dipertahankan

- accounts;
- account_sessions;
- consents;
- rate_limits;
- audit_logs;
- test_sessions;
- user_answers;
- personality_results;
- dimension_scores;
- result_share_tokens;
- feedback.

### 21.2 Module catalog

#### modules

- id;
- key;
- public_name;
- internal_name;
- evidence_tier;
- category;
- status;
- description_key;
- created_at;
- updated_at.

#### module_versions

- id;
- module_id;
- version;
- scoring_strategy;
- composer_config_json;
- report_template_version;
- status;
- published_at;
- retired_at;
- config_json.

#### question_dimensions

- id;
- module_version_id;
- construct_key;
- facet_key;
- label;
- description;
- minimum_item_coverage.

#### questions

- id;
- module_version_id;
- dimension_id;
- item_code;
- internal_construct_note;
- polarity;
- weight;
- response_scale;
- exposure_group;
- sensitivity_level;
- status;
- created_at;
- updated_at.

#### question_translations

- id;
- question_id;
- locale;
- public_text;
- helper_text;
- reading_level;
- review_status.

### 21.3 Composer and combo

#### combo_presets

- id;
- key;
- public_name;
- description;
- status;
- recommended_mode;
- created_at;
- updated_at.

#### combo_preset_modules

- combo_preset_id;
- module_id;
- display_order;
- required;
- dependency_rule_json.

#### assessment_blueprints

- id;
- composer_version;
- mode;
- locale;
- selected_modules_json;
- segment_plan_json;
- item_count;
- estimated_minutes;
- blueprint_hash;
- created_at.

#### assessment_blueprint_items

- blueprint_id;
- question_id;
- segment_index;
- display_order;
- module_key;
- construct_key;
- scoring_role;
- consistency_pair_key.

### 21.4 Session extension

#### test_session_modules

- session_id;
- module_version_id;
- blueprint_id;
- status;
- item_count;
- required_answers;
- completed_at.

#### test_session_segments

- id;
- session_id;
- segment_index;
- status;
- started_at;
- completed_at.

### 21.5 Result extension

#### result_modules

- id;
- result_id;
- module_key;
- module_version_id;
- scoring_version;
- confidence;
- ambiguity_json;
- summary_json;
- quality_json;
- created_at.

#### result_module_scores

- id;
- result_module_id;
- construct_key;
- facet_key;
- raw_score;
- normalized_score;
- confidence;
- rank_or_candidate_json.

#### result_correlations

- id;
- result_id;
- correlation_version;
- aligned_patterns_json;
- tensions_json;
- report_content_keys_json;
- confidence;
- created_at.

#### result_clarifiers

- id;
- result_id;
- module_key;
- trigger_reason;
- status;
- item_count;
- completed_at.

### 21.6 Constraints

- Unique session + question answer.
- Unique idempotency key.
- Result unique per completed session.
- Blueprint immutable setelah digunakan.
- Module version immutable setelah published.
- Token disimpan sebagai hash.
- Foreign-key delete behavior eksplisit.
- RLS forced pada tabel sensitif.
- Browser role tidak memiliki direct policy untuk raw answer atau result.

---

## 22. Frontend Minimal tetapi Lengkap

### 22.1 Tujuan

Frontend fase berikutnya tidak mengejar visual final. Targetnya adalah seluruh implementasi produk dapat digunakan dan diuji dengan tampilan sederhana, konsisten, responsive, dan accessible.

### 22.2 Prinsip

- Functional completeness lebih penting dari dekorasi.
- Gunakan primitive component sederhana.
- Hindari hardcoded business rule dalam component.
- Data berasal dari typed DTO.
- Semua state wajib tersedia.
- Desain final harus dapat mengganti styling dan composition tanpa mengubah API.

### 22.3 Required components

- AppShell.
- SiteHeader.
- ModuleCard.
- EvidenceBadge.
- ModuleMultiSelect.
- ComboPresetCard.
- ModeCard.
- SelectionSummary.
- ConsentForm.
- TestProgress.
- SectionProgress.
- QuestionCard.
- LikertSelector.
- AutosaveStatus.
- PauseResumePanel.
- ClarifierPrompt.
- ResultHero.
- ModuleResultSection.
- TraitBars.
- ConfidenceBadge.
- QualityNotice.
- TensionCard.
- GrowthActionCard.
- ShareControls.
- ExportControls.
- PrivacyControls.
- DeleteResultForm.
- DeleteAccountForm.
- LoadingState.
- EmptyState.
- ErrorState.

### 22.4 Minimal visual direction

- Background netral.
- Satu warna aksen utama.
- Typography jelas.
- Card sederhana.
- Whitespace cukup.
- Tidak perlu ilustrasi final.
- Tidak perlu animasi kompleks.
- Tidak perlu gradient atau brand visual final bila menghambat fungsi.
- Semua interactive target minimum nyaman untuk touch.

### 22.5 State completeness

Setiap flow harus memiliki:

- loading;
- success;
- validation error;
- network error;
- unauthorized;
- expired session;
- deleted result;
- revoked share;
- empty data;
- retry;
- reduced-motion safe behavior.

### 22.6 Frontend acceptance

- Pengguna dapat memilih satu module.
- Pengguna dapat memilih combo.
- Estimasi item dan durasi berubah sesuai pilihan.
- Pengguna dapat memilih Quick, Normal, atau Complex.
- Pengguna dapat menyelesaikan multi-section assessment.
- Progress dan autosave terlihat.
- Pengguna dapat melihat report per module dan integrated report.
- Seluruh privacy control dapat digunakan.
- Desktop dan mobile test lulus.
- UI dapat di-restyle kemudian tanpa mengubah domain service.

---

## 23. Authentication, Privacy, dan Security

### 23.1 Authentication

- Password Argon2id atau primitive modern setara.
- Generic login error.
- HttpOnly cookie.
- Secure di production.
- SameSite sesuai flow.
- Session expiration dan revocation.
- Email verification sebelum skala publik besar.
- Password reset token disimpan sebagai hash.

### 23.2 Authorization

Roles:

- guest;
- user;
- content_editor;
- psychometric_reviewer;
- admin;
- super_admin.

Rules:

- Guest hanya mengakses session dan result dengan token valid.
- User hanya mengakses data sendiri.
- Admin tidak boleh membaca raw private result tanpa support permission dan audit event.
- Content editor tidak mendapat akses credential atau account data.

### 23.3 RLS

- Forced RLS pada tabel sensitif.
- Default deny.
- Tidak ada broad anon select.
- Tidak ada direct public feedback insert.
- Service role hanya di trusted server environment.
- Browser hanya menerima DTO aman.

### 23.4 Token security

- Entropy minimum 128-bit, rekomendasi 256-bit.
- HMAC hash dengan pepper server-only.
- Expiration.
- Revocation.
- Rotation.
- Constant-time comparison bila relevan.
- Rate limiting.
- Tidak ada token di log atau analytics.

### 23.5 Metadata privacy

- Private result `noindex`.
- Invalid, expired, atau revoked token menghasilkan metadata generik.
- OG image memvalidasi share scope.
- Internal ID tidak muncul di metadata.

### 23.6 Data rights

MVP target:

- view result;
- export JSON;
- delete result;
- revoke share;
- delete account;
- withdraw optional consent.

### 23.7 Retention

- Incomplete guest sessions default 30 hari.
- Guest result mengikuti consent dan retention policy.
- Account result disimpan sampai user menghapus.
- Rate-limit logs 30–90 hari.
- Audit logs lebih lama sesuai security policy.
- Deletion harus memiliki documented hard-delete path.

---

## 24. Admin dan Content Operations

### 24.1 MVP admin

Minimal-complete admin dapat sederhana, tetapi harus mendukung:

- melihat module registry;
- melihat module version;
- melihat published item count;
- melihat combo preset;
- melihat scoring version;
- melihat feedback summary;
- melihat audit logs sesuai role;
- menjalankan seed/import preview;
- memvalidasi blueprint sebelum publish.

### 24.2 Publication workflow

```text
Draft item
→ language review
→ construct review
→ bias and legal review
→ pilot
→ publish module version
→ lock version
→ monitor analytics
→ retire bila diperlukan
```

### 24.3 Audit events

Wajib log:

- admin login;
- create/update/retire item;
- publish module version;
- publish combo preset;
- publish scoring version;
- access sensitive admin page;
- export internal analytics;
- support access ke private result bila fitur tersebut ada.

---

## 25. Analytics dan Psychometric Validation

### 25.1 Product metrics

- landing CTA rate;
- module selection rate;
- combo selection distribution;
- mode selection distribution;
- assessment start rate;
- completion per mode;
- drop-off per item/section;
- resume rate;
- clarifier acceptance;
- result share rate;
- account conversion;
- result deletion;
- feedback rating.

### 25.2 Psychometric metrics

- item mean dan variance;
- missing rate;
- response time distribution;
- item-total correlation;
- internal consistency estimate;
- test-retest correlation;
- factor analysis;
- differential item functioning;
- threshold ambiguity rate;
- module confidence distribution;
- cross-module correlation.

### 25.3 Validation roadmap

#### Pre-pilot

- define constructs;
- write original items;
- language review;
- cultural bias review;
- legal review;
- cognitive interview kecil.

#### Pilot 1

- collect initial responses;
- analyze item distribution;
- remove poor items;
- calibrate completion time;
- validate composer coverage.

#### Pilot 2

- larger sample;
- exploratory factor analysis;
- reliability and correlation;
- revise item and thresholds;
- calibrate provisional precision messaging.

#### Validation phase

- confirmatory factor analysis bila layak;
- test-retest;
- DIF;
- initial norming;
- technical manual.

Persentase ketelitian publik hanya boleh ditingkatkan atau diklaim lebih tegas setelah evidence tersedia.

---

## 26. Accessibility dan UX Quality

Target WCAG 2.2 AA.

Wajib:

- semantic HTML;
- keyboard navigation;
- visible focus;
- screen-reader labels;
- field error association;
- sufficient contrast;
- touch target memadai;
- reduced-motion support;
- no timeout tanpa warning;
- progress tidak hanya mengandalkan warna;
- clear language;
- mobile viewport coverage;
- pause untuk assessment panjang.

Formal accessibility audit menjadi release gate sebelum scale publik besar.

---

## 27. Testing Strategy

### 27.1 Unit

- composer quota dan deterministic ordering;
- reverse coding;
- normalization;
- module scoring;
- confidence;
- clarifier trigger;
- correlation rules;
- token hashing;
- validation schema;
- safe DTO;
- content rendering helper.

### 27.2 Integration

- catalog read;
- assessment estimate;
- start single lens;
- start combo;
- answer sync;
- resume;
- multi-segment completion;
- clarifier;
- atomic result;
- share and revoke;
- export;
- delete;
- auth lifecycle.

### 27.3 Database and RLS

- anon cannot read sensitive tables;
- browser role cannot insert feedback directly;
- service path can perform authorized operation;
- blueprint immutable;
- published module version immutable;
- result owner access;
- invalid share denied;
- expired share denied;
- revoked share denied;
- delete cascades or cleanup sesuai policy.

### 27.4 E2E

- guest single-lens Quick;
- account combo Normal;
- Complex multi-section resume;
- clarifier flow;
- private result protection;
- share and revoke;
- export;
- delete result;
- delete account;
- mobile viewport;
- keyboard-only flow.

### 27.5 Release commands

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit
npm run db:reset
npm run test:integration
npm run test:db
npm run test:e2e
```

Database reset dan destructive tests hanya boleh dijalankan pada database lokal/disposable, tidak pernah pada production.

---

## 28. Deployment dan Operations

### 28.1 Current topology

- Vercel production.
- Supabase hosted Singapore.
- GitHub Actions.
- Satu production environment.

### 28.2 Required improvements

- staging environment terpisah;
- preview-scoped environment variables;
- monitoring dan alerting;
- structured safe logs;
- backup and restore drill;
- migration runbook;
- custom domain;
- email delivery setup;
- incident response guide;
- secret rotation procedure.

### 28.3 Health endpoint

Health endpoint hanya menunjukkan liveness dan tidak membocorkan database, region, version detail sensitif, atau credential state.

### 28.4 Migration safety

- Additive migration first.
- No production reset.
- Dry-run before push.
- Backfill terpisah dan resumable.
- Read compatibility sebelum write cutover.
- Rollback atau forward-fix plan terdokumentasi.

---

## 29. Implementation Phases Setelah PRD 2.0

### Phase A: Contract Freeze

- PRD 2.0 merged.
- Terminology final.
- Module catalog final.
- Mode target final.
- API and data contract reviewed.
- Current implementation gaps recorded.

### Phase B: Modular Backend Foundation

- module registry;
- module version;
- combo preset;
- blueprint composer;
- selected session modules;
- segment model;
- result module model;
- backward-compatible migration;
- public catalog and estimate endpoint.

### Phase C: Minimal-Complete Frontend

- module selection;
- combo presets;
- mode selection;
- review summary;
- consent;
- multi-section runner;
- report per module;
- integrated report;
- complete privacy controls;
- all loading/error/empty states;
- desktop and mobile E2E.

Visual tetap minimal. Jangan menunggu desain final untuk menyelesaikan fungsi.

### Phase D: Independent Scoring

- Trait Profile independent scoring;
- 16-Type independent scoring;
- Enneagram independent scoring;
- Temperament independent scoring;
- module-level confidence;
- remove trait-derived fake overlays;
- preserve old result reader.

### Phase E: Combo, Complex, Clarifier

- dynamic composer;
- Normal 80–90;
- Complex 100–120;
- clarifier 12–24;
- multi-session;
- correlation engine;
- tension report.

### Phase F: Catalog Expansion

- Three-Center;
- Instinctual Variant;
- Socionics-inspired;
- RIASEC;
- Attachment;
- Psychosophy experimental;
- optional cultural lenses.

Modul hanya dipublish setelah item dan scoring memenuhi review gate.

### Phase G: Design Replacement

- pasang design system final;
- ganti visual component;
- pertahankan route, DTO, domain service, tests, dan accessibility;
- lakukan visual regression dan formal WCAG audit.

### Phase H: Scale and Validation

- email verification;
- password reset;
- staging;
- monitoring;
- backup drill;
- psychometric pilot;
- technical manual;
- claim review.

---

## 30. Migration dari MVP Saat Ini

### 30.1 Current mode mapping

- Existing `quick` tetap valid.
- Existing `standard` dipresentasikan sebagai public label Normal.
- Tambahkan `deep` untuk Complex.
- Existing result tidak diubah retroaktif.

### 30.2 Current question bank

- Existing 60 Standard dan 40 Quick dipertahankan sebagai `trait-profile-mvp-1`.
- Item perlu dimapping ke module version dan blueprint baru.
- Item tidak otomatis digunakan untuk module lain.
- New module item bank ditambahkan terpisah.

### 30.3 Current overlay result

Result lama yang menampilkan trait-derived overlay tetap dapat dibaca dengan label `Legacy MVP interpretation` atau format kompatibilitas.

Untuk sesi baru setelah independent module scoring aktif:

- 16-Type hanya muncul bila module dipilih dan itemnya dikerjakan;
- Enneagram hanya muncul bila module dipilih dan itemnya dikerjakan;
- Temperament hanya muncul bila module dipilih dan itemnya dikerjakan;
- output legacy tidak boleh digunakan.

### 30.4 Frontend migration

- Route lama tetap redirect atau adapter.
- `/start` berubah menjadi entry ke module selection.
- Start request lama dapat dipetakan ke default preset Trait Profile selama masa transisi.
- Result component lama harus mendukung legacy dan modular result DTO.

### 30.5 Production safety

- Gunakan additive migrations.
- Backfill module metadata tanpa mengubah answer.
- Deploy read path sebelum write path baru.
- Feature flag composer dan new modes.
- Pilot internal sebelum public enable.

---

## 31. Acceptance Criteria Produk

Produk target dinyatakan lengkap bila:

1. Pengguna dapat memilih satu lensa.
2. Pengguna dapat memilih custom combo.
3. Pengguna dapat memilih preset combo.
4. Pengguna dapat memilih Quick, Normal, atau Complex.
5. Estimasi item dan durasi dihitung dari pilihan aktual.
6. Consent tersimpan dengan version.
7. Blueprint immutable dibuat server-side.
8. Autosave dan resume idempotent.
9. Complex dapat dibagi menjadi beberapa section atau segment.
10. Scoring setiap module independen dan deterministic.
11. Clarifier tersedia untuk ambiguity.
12. Result dibuat secara atomic.
13. Confidence per module tersedia.
14. Response quality dijelaskan.
15. Correlation engine tidak mengubah score primer.
16. Result private by default.
17. Share dapat dibuat, expired, rotated, dan revoked.
18. Export dan delete tersedia.
19. Frontend lengkap secara fungsi walau desain minimal.
20. Legacy result tetap dapat dibaca.
21. RLS, authorization, dan secret boundary teruji.
22. Lint, typecheck, unit, integration, database, E2E, build, dan audit lulus.
23. Tidak ada klaim ilmiah atau social proof palsu.
24. Privacy, terms, disclaimer, deployment, dan migration docs tersedia.
25. Production dapat dibangun dari Git commit yang terverifikasi.

---

## 32. Definition of Done per Feature

Setiap fitur dianggap selesai bila:

- requirement dan acceptance criteria terpenuhi;
- input divalidasi;
- authorization ada;
- error, loading, empty, dan retry state tersedia;
- test relevan ada;
- accessibility diperiksa;
- tidak membuka data sensitif;
- tidak menambah klaim palsu;
- migration aman;
- dokumentasi diperbarui;
- CI hijau;
- evidence command nyata tersedia.

---

## 33. Risiko dan Mitigasi

### Scientific overclaim

Mitigasi: evidence tier, disclaimer, provisional label, validation roadmap, claim review.

### User merasa hasil tidak cocok

Mitigasi: pilihan kedalaman, confidence, ambiguity, clarifier, feedback, retest, dan tidak memakai label mutlak.

### Test fatigue

Mitigasi: mode Quick, progress, section break, pause, resume, composer dedupe, maksimal 120 per segment.

### Fake modularity

Risiko: UI menawarkan banyak lensa tetapi backend hanya menurunkan label dari Big Five.

Mitigasi: independent module items, scoring version, result_modules, dan regression test yang melarang output module tanpa module completion.

### Privacy leak

Mitigasi: forced RLS, server DTO, token hash, noindex, generic metadata, share scope, security tests.

### Version drift

Mitigasi: immutable module version, blueprint hash, scoring version, content version, legacy reader.

### UI redesign merusak aplikasi

Mitigasi: typed DTO, domain service terpisah, component contract, E2E stable selector, design-neutral frontend.

### Single production environment

Mitigasi: staging roadmap, strict migration runbook, backup drill, feature flag, additive migration.

---

## 34. Success Metrics

### Product

- Completion Quick ≥ 75% setelah calibration.
- Completion Normal ≥ 60%.
- Completion Complex ≥ 40% atau segment resume yang sehat.
- Resume success ≥ 95%.
- Result access error < 1%.
- Share revoke success 100% pada test.
- Account/result deletion success 100% pada test.

### Quality

- CI required checks hijau.
- 0 high/critical npm vulnerabilities.
- 0 known direct browser policy pada sensitive tables.
- 0 raw token persisted.
- 0 private result exposed tanpa authorization.

### Learning

- Feedback “hasil terasa relevan” meningkat per mode.
- Complex seharusnya menunjukkan ambiguity rate lebih rendah dibanding Quick setelah sample cukup.
- Clarifier harus meningkatkan confidence tanpa meningkatkan drop-off secara tidak wajar.

Target numerik harus ditinjau ulang setelah data produksi cukup dan tidak boleh digunakan sebagai klaim publik tanpa konteks.

---

## 35. Environment Variables Target

```text
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
TEST_DATABASE_URL=
AUTH_SESSION_SECRET=
CSRF_SECRET=
TOKEN_HASH_PEPPER=
RATE_LIMIT_SECRET=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
FEATURE_MODULAR_COMPOSER=
FEATURE_COMPLEX_MODE=
FEATURE_PROVISIONAL_PRECISION=
FEATURE_AI_NARRATIVE=
```

Rules:

- Jangan commit `.env`.
- Jangan expose database credential atau service role ke client.
- Semua production secret diverifikasi sebelum deploy.
- Preview dan staging memakai secret terpisah.
- Feature flag default fail closed untuk fitur experimental.

---

## 36. AI Policy

AI boleh:

- memvariasikan bahasa report berdasarkan score final read-only;
- membuat growth tips dari template terkontrol;
- menjelaskan tension yang sudah dihasilkan rule engine;
- membuat caption share aman;
- membantu admin meninjau wording item tanpa mempublish otomatis.

AI tidak boleh:

- menghitung score primer;
- mengubah score atau type;
- membuat diagnosis;
- memberi saran medis;
- membaca raw answer tanpa consent dan purpose yang jelas;
- menyimpan chat sensitif tanpa consent;
- mengklaim membaca pikiran pengguna.

AI feature harus memiliki consent, retention, minimal logging, dan safe prompt template.

---

## 37. Glossary

- **Lens/Module:** sistem assessment independen.
- **Mode:** tingkat kedalaman Quick, Normal, atau Complex.
- **Combo:** pilihan dua atau lebih module.
- **Preset:** combo yang dikurasi.
- **Blueprint:** komposisi item immutable untuk satu session.
- **Composer:** service penyusun blueprint.
- **Clarifier:** item tambahan untuk ambiguity.
- **Confidence:** keyakinan internal terhadap kestabilan result, bukan kepastian kebenaran.
- **Evidence Tier:** posisi kekuatan evidence dan tujuan module.
- **Reflective Tension:** dua pola lintas module yang tampak berbeda tetapi dapat bergantung konteks.
- **Legacy Result:** result dari MVP sebelum independent module scoring.

---

## 38. Change Log Versi 2.0

Perubahan utama dari versi 1.0:

- Menetapkan single-lens, custom combo, curated combo, dan full spectrum sebagai core product.
- Menetapkan Quick, Normal, Complex, dan Clarifier.
- Menetapkan target Normal 80–90 dan Complex 100–120.
- Menambahkan provisional precision messaging beserta guardrail.
- Menetapkan Test Composer dan immutable blueprint.
- Menetapkan independent module scoring sebagai kewajiban.
- Melarang trait-derived fake overlay untuk session baru.
- Menambahkan correlation dan reflective tension engine.
- Menetapkan module catalog 10 core/experimental dan optional cultural lenses.
- Menambahkan backend contract, API, data model, migration plan, dan backward compatibility.
- Menetapkan frontend minimal tetapi lengkap sebagai fase sebelum desain final.
- Mencatat baseline production dan gap terhadap target.
- Menambahkan roadmap implementasi bertahap yang aman untuk production.

---

## 39. Keputusan Final Produk

LensaDiri harus dibangun sebagai **platform multi-lensa yang benar-benar modular**, bukan satu tes trait yang menghasilkan banyak label turunan.

Pengguna bebas memilih:

- satu lensa;
- combo beberapa lensa;
- preset;
- paket lengkap;
- Quick;
- Normal;
- Complex.

Setiap lensa wajib dihitung secara independen. Test Composer menyusun soal sesuai pilihan dan kedalaman. Result per modul digabung melalui correlation engine tanpa mengubah score primer. Confidence dan batasan dijelaskan sejak sebelum tes hingga halaman hasil.

Backend harus aman, versioned, server-authoritative, dan backward-compatible. Frontend harus lengkap secara fungsi dengan desain minimal agar visual final dapat dipasang kemudian tanpa mengulang sistem inti.

Prioritas sesudah PRD ini adalah mengubah baseline production secara bertahap sampai memenuhi kontrak tersebut, dengan migration additive, feature flag, test lengkap, dan tanpa reset data pengguna.

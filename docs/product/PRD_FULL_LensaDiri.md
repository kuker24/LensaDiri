# PRD FULL LensaDiri

**Versi:** 1.0  
**Status:** Full product planning untuk build baru dari nol  
**Tanggal:** 10 Juli 2026  
**Repository:** `kuker24/LensaDiri`  
**Nama produk:** LensaDiri  
**Tagline kerja:** Kenali pola dirimu lewat banyak lensa  
**Target platform:** Web app mobile-first, bilingual ID/EN  
**Target stack:** Next.js App Router, TypeScript, PostgreSQL/Supabase Database, Tailwind CSS, server-first architecture, internal auth  
**Prinsip utama:** privacy-first, deterministic scoring, scientific honesty, modular engine, Gen Z Indonesia friendly  
**Catatan penting:** dokumen ini adalah rencana produk dan teknis penuh untuk implementasi baru, bukan patch dari aplikasi lama.

---

## 0. Ringkasan Eksekutif

LensaDiri adalah platform eksplorasi kepribadian modular berbasis web. Produk ini membantu pengguna memahami pola diri melalui beberapa lensa kepribadian yang diposisikan secara jujur sesuai tingkat kekuatan bukti masing-masing.

Produk tidak boleh diposisikan sebagai alat diagnosis, alat rekrutmen mutlak, alat klinis, atau alat prediksi masa depan. LensaDiri adalah self-discovery platform yang menggabungkan core trait yang lebih kuat secara psikometrik dengan overlay reflektif yang populer, visual, personal, dan mudah dibagikan.

Keputusan produk utama:

1. Big Five atau trait-dimensional internal menjadi backbone psikometrik.
2. Jungian-inspired 16-Type, Enneagram, Temperament, Instinctual Variant, Socionics, Psychosophy, dan modul sejenis menjadi reflective overlay.
3. Golongan darah, angka tanggal lahir, atau symbolic lens lain hanya boleh menjadi cultural atau fun layer, bukan skor psikometrik.
4. AI tidak boleh menghitung skor primer.
5. Scoring utama harus deterministik, versioned, repeatable, dan dijalankan di sisi server.
6. Semua hasil bersifat private secara default.
7. Public sharing hanya terjadi melalui aksi eksplisit pengguna.
8. Data hasil kepribadian diperlakukan sebagai data sensitif.
9. Produk harus mobile-first, cepat, accessible, dan ramah Gen Z Indonesia.
10. Tidak memakai WorkOS/AuthKit.
11. Supabase digunakan sebagai PostgreSQL database dan storage bila dibutuhkan, bukan sebagai alasan membuka akses langsung data sensitif dari client.

Tujuan PRD ini adalah memberi blueprint lengkap untuk AI coding agent, developer, designer, QA, security engineer, dan release engineer agar dapat membangun LensaDiri dari awal dengan arah yang jelas.

---

## 1. Latar Belakang Produk

### 1.1 Masalah pengguna

Pengguna Indonesia, khususnya Gen Z, menyukai konten kepribadian karena mudah dipakai untuk memahami diri, relasi, gaya belajar, gaya kerja, dan komunikasi. Namun kebanyakan produk tes kepribadian publik memiliki beberapa masalah:

- Terlalu panjang dan melelahkan.
- Hasil terlalu absolut.
- Klaim ilmiah berlebihan.
- Tidak menjelaskan batasan validitas.
- Tidak membedakan tes berbasis bukti dengan lensa populer.
- Menggunakan nama atau istilah proprietary tanpa lisensi.
- Tidak transparan soal penyimpanan data.
- Hasil sulit ditindaklanjuti.
- Terlalu fokus pada label, bukan growth path.
- Pengalaman mobile kurang nyaman.

### 1.2 Masalah pasar

Pasar memiliki dua kebutuhan yang sering bertabrakan:

1. **Kredibilitas:** pengguna dan publik butuh hasil yang tidak asal mengarang.
2. **Viralitas:** pengguna ingin hasil yang visual, personal, dan mudah dibagikan.

LensaDiri harus menyelesaikan konflik ini dengan desain produk yang membedakan skor inti, overlay reflektif, dan konten naratif.

### 1.3 Masalah teknis yang harus dihindari

Build baru harus menghindari masalah umum pada aplikasi tes kepribadian:

- Client menghitung skor dan mengirim hasil final ke server.
- Public result bisa dibaca langsung dari database.
- Feedback publik bisa bypass validasi API.
- Metadata halaman membocorkan hasil private.
- Jawaban hilang karena race condition.
- Sesi selesai tetapi hasil belum konsisten.
- Token sharing bisa ditebak atau tidak bisa dicabut.
- Admin panel membuka metadata item ke client umum.
- AI menyimpan percakapan sensitif tanpa consent.
- Landing page memakai dummy social proof atau testimonial palsu.

---

## 2. Visi Produk

LensaDiri menjadi platform self-discovery modular untuk memahami pola diri secara jujur, ringan, personal, dan actionable.

Visi jangka panjang:

- Menjadi personality engine modular yang bisa dikembangkan ke berbagai modul.
- Memiliki item bank yang versioned, dapat diaudit, dan bisa divalidasi.
- Memiliki laporan hasil yang personal tanpa overclaim.
- Mendukung mode anonim dan akun.
- Memberi kontrol privasi penuh kepada pengguna.
- Menjadi produk edukasi self-growth yang kredibel dan mudah digunakan.
- Siap berkembang menjadi platform B2C premium, B2B wellness ringan, dan API internal di masa depan.

---

## 3. Positioning Produk

### 3.1 Positioning utama

LensaDiri adalah platform eksplorasi kepribadian modular yang membantu pengguna melihat pola diri dari beberapa lensa, mulai dari trait psikometrik sampai refleksi gaya berpikir, motivasi, relasi, dan pengembangan diri.

### 3.2 Bukan positioning produk

LensaDiri bukan:

- Tes MBTI resmi.
- Alat diagnosis klinis.
- Alat rekrutmen final.
- Alat prediksi masa depan.
- Pengganti psikolog, psikiater, konselor, atau asesmen profesional.
- Produk yang mengklaim akurasi ilmiah penuh sebelum validasi formal.

### 3.3 Kalimat produk publik

Contoh headline:

> Kenali pola dirimu lewat banyak lensa.

Contoh subheadline:

> LensaDiri membantu kamu memahami gaya berpikir, motivasi, emosi, relasi, dan arah pengembangan diri melalui tes kepribadian modular yang ringan, visual, dan privacy-first.

Contoh disclaimer pendek:

> Hasil LensaDiri adalah alat refleksi diri, bukan diagnosis atau keputusan profesional.

---

## 4. Target Pengguna

### 4.1 Primary audience

Gen Z Indonesia berusia sekitar 15 sampai 27 tahun yang aktif di mobile, suka self-discovery, suka konten visual, dan sering membagikan hasil ke media sosial.

Kebutuhan utama:

- Tes cepat dan tidak membosankan.
- Hasil mudah dipahami.
- Kartu hasil estetik.
- Bahasa tidak menghakimi.
- Insight yang terasa personal.
- Rekomendasi pengembangan diri yang bisa dipraktikkan.
- Kontrol privasi.

### 4.2 Secondary audience

Mahasiswa, fresh graduate, kreator konten self-growth, komunitas pengembangan diri, mentor, dan pengguna yang ingin memahami gaya belajar, kerja, relasi, dan komunikasi.

### 4.3 Future audience

- Konselor non-klinis.
- Komunitas belajar.
- B2B lightweight team reflection.
- Creator atau media partner.
- Developer internal yang memakai engine scoring untuk produk turunan.

---

## 5. Persona Pengguna

### 5.1 Persona A: Siswa atau mahasiswa penasaran

Nama contoh: Raka  
Usia: 18  
Motivasi: ingin tahu tipe dirinya dan membandingkan dengan teman.  
Pain point: malas isi tes panjang.  
Kebutuhan: tes cepat, hasil visual, share card, bahasa santai.  
Risiko: mudah percaya label absolut.  
Solusi produk: disclaimer ringan, confidence score, insight yang tidak mengkotakkan.

### 5.2 Persona B: Fresh graduate

Nama contoh: Dinda  
Usia: 23  
Motivasi: ingin memahami gaya kerja, komunikasi, dan arah karier.  
Pain point: hasil tes umum sering tidak actionable.  
Kebutuhan: growth plan, career hints, learning preferences.  
Solusi produk: hasil trait, rekomendasi komunikasi, growth plan 7 dan 30 hari.

### 5.3 Persona C: Pengguna self-growth serius

Nama contoh: Nara  
Usia: 26  
Motivasi: memahami pola motivasi, konflik batin, blind spot, dan relasi.  
Pain point: ingin hasil dalam, bukan hanya label.  
Kebutuhan: Standard atau Deep test, Enneagram overlay, narrative report, export PDF.  
Solusi produk: laporan modular dengan tension analysis dan confidence explanation.

### 5.4 Persona D: Admin psikometri atau content editor

Nama contoh: Admin Lab  
Motivasi: mengelola item bank, modul, scoring version, dan konten hasil.  
Pain point: item bisa bocor, perubahan bisa merusak hasil lama.  
Kebutuhan: admin panel aman, versioning, audit log, preview report.  
Solusi produk: role-based admin, migration-safe module registry, scoring version lock.

---

## 6. Prinsip Produk

1. **Honest by design:** jangan mengklaim validasi yang belum dimiliki.
2. **Private by default:** hasil tidak publik kecuali user memilih berbagi.
3. **Server authoritative:** server adalah sumber kebenaran untuk sesi, jawaban, scoring, dan hasil.
4. **Deterministic scoring:** hasil bisa direproduksi berdasarkan versi modul dan jawaban yang sama.
5. **Modular:** setiap modul bisa ditambah, dimatikan, atau diubah versinya tanpa merusak modul lain.
6. **Evidence tier visible:** semua modul diberi badge tingkat bukti.
7. **No proprietary misuse:** hindari nama resmi bermerek jika tidak berlisensi.
8. **Mobile-first:** semua flow utama nyaman di layar kecil.
9. **Accessible:** memenuhi target WCAG 2.2 AA.
10. **No fake trust:** tidak boleh memakai testimonial, angka pengguna, atau klaim sosial palsu.
11. **Actionable:** hasil harus berisi langkah nyata, bukan sekadar deskripsi.
12. **Fail closed:** bila terjadi error akses, sistem menolak, bukan membuka data.

---

## 7. Evidence Tier dan Posisi Modul

### 7.1 Evidence tier

Setiap modul wajib memiliki badge:

- **Tier A:** Evidence-oriented psychometric layer.
- **Tier B:** Question-based reflective typology layer.
- **Tier C:** Symbolic atau cultural reflective layer.
- **Experimental:** modul eksploratif yang belum masuk scoring utama.

### 7.2 Tier A: Core psychometric backbone

Modul utama:

- Big Five atau trait-dimensional internal.
- SLOAN sebagai kode ringkas turunan dari trait.

Posisi:

- Menjadi skor inti.
- Ditampilkan sebagai spektrum, bukan tipe kaku.
- Memiliki facet dan confidence band.
- Dipakai sebagai backbone mapping overlay.

### 7.3 Tier B: Reflective typology overlay

Modul:

- Jungian-inspired 16-Type.
- Enneagram core type dan wing.
- Temperament.
- Instinctual Variant.
- Socionics-inspired communication lens.
- Attachment style, bila ditambahkan.
- RIASEC career interest, bila ditambahkan.

Posisi:

- Boleh tampil sebagai label.
- Harus menjelaskan bahwa hasil adalah refleksi kecenderungan.
- Tidak boleh dipakai sebagai keputusan mutlak.

### 7.4 Tier C: Symbolic atau cultural layer

Modul:

- Golongan darah.
- 9-Type symbolic lens.
- Tanggal lahir atau angka simbolik.

Posisi:

- Fun atau cultural reflection only.
- Tidak boleh mengklaim sebab biologis, medis, genetik, atau ilmiah.
- Harus dipisahkan visualnya dari hasil psikometrik.

### 7.5 Experimental layer

Modul:

- Psychosophy atau Attitudinal Psyche.
- Modul komunitas yang belum divalidasi.
- Modul naratif berbasis archetype.

Posisi:

- Tidak masuk MVP scoring utama.
- Bisa menjadi konten edukasi atau eksperimen di V2/V3.
- Harus diberi label experimental.

---

## 8. Legal, Brand, dan Klaim

### 8.1 Larangan istilah publik tanpa lisensi

Jangan memakai istilah berikut sebagai nama fitur resmi, headline marketing, atau klaim instrumen resmi:

- MBTI.
- Myers-Briggs Type Indicator.
- Tritype sebagai merek resmi jika konteksnya mengarah ke produk proprietary.
- Nama instrumen komersial seperti RHETI.
- Item pertanyaan dari tes berbayar atau proprietary.

### 8.2 Istilah aman

Gunakan istilah:

- Jungian-inspired 16-Type Framework.
- 16-Type Personality Lens.
- Enneagram-inspired Motivation Lens.
- Three-Center Pattern, bila perlu sebagai alternatif Tritype-like.
- Trait Profile.
- Reflective Overlay.
- Symbolic Lens.

### 8.3 Aturan klaim ilmiah

Dilarang:

- “Akurat 100%”.
- “Tes psikologi resmi”.
- “Diagnosis kepribadian”.
- “Memprediksi karier terbaik secara pasti”.
- “Cocok untuk rekrutmen”.
- “Setara asesmen psikolog profesional”.

Boleh:

- “Membantu refleksi diri”.
- “Menggambarkan kecenderungan”.
- “Berbasis scoring deterministik”.
- “Menggunakan trait sebagai fondasi”.
- “Dikembangkan dengan prinsip privasi dan transparansi”.

---

## 9. Scope Produk

### 9.1 MVP

MVP harus fokus pada core loop:

> Landing page → pilih mode tes → consent → isi assessment → scoring server-side → result page → share card opsional → simpan atau hapus data.

Fitur MVP wajib:

1. Landing page.
2. Informasi metode dan disclaimer.
3. Mode guest assessment.
4. Opsi akun internal sederhana.
5. Consent sebelum tes.
6. Module selection sederhana.
7. Quick Test dan Standard Test.
8. Test runner mobile-first.
9. Autosave jawaban.
10. Resume session untuk guest via token aman.
11. Server-side scoring.
12. Big Five atau trait backbone.
13. Jungian-inspired 16-Type overlay.
14. Enneagram core type dan wing basic overlay.
15. Temperament basic overlay.
16. Confidence score dan response quality checks.
17. Result report web.
18. Share card tanpa data sensitif berlebihan.
19. Private result by default.
20. Token sharing eksplisit.
21. Feedback result.
22. Basic admin seed untuk question bank.
23. Privacy center minimal.
24. Delete result.
25. Export JSON data minimal.
26. CI, lint, typecheck, test, build.

### 9.2 V1

Fitur V1:

- Deep Test.
- Clarifier module otomatis 12 sampai 24 item.
- Growth plan 7 dan 30 hari.
- Result comparison antar modul.
- Admin item bank UI.
- Item analytics.
- A/B wording test aman.
- Better SEO content pages.
- PDF export premium.
- Email verification.
- Password reset.
- Account dashboard.

### 9.3 V2

Fitur V2:

- RIASEC career module.
- Attachment style module.
- Instinctual Variant.
- Socionics-inspired interpersonal lens.
- Growth plan 60 dan 90 hari.
- Premium deep report.
- Norming dashboard internal.
- Reliability analytics.
- Retest comparison.
- Referral sharing.
- Bilingual ID/EN penuh.

### 9.4 V3

Fitur V3:

- Psychosophy experimental module.
- Symbolic cultural lens.
- Adaptive testing research prototype.
- API internal untuk engine.
- Cohort insights anonim.
- Technical manual publik bila data validasi sudah cukup.

### 9.5 Out of scope MVP

Tidak dibuat di MVP:

- Diagnosis klinis.
- Marketplace psikolog.
- Payment kompleks.
- B2B admin organization.
- Adaptive testing berbasis IRT.
- Chat AI bebas tanpa consent retention.
- Public leaderboard.
- Direct Supabase client access ke data sensitif.

---

## 10. Mode Tes

### 10.1 Quick Test

Tujuan:

- Onboarding cepat.
- Cocok untuk pengguna baru.
- Meningkatkan completion rate.

Spesifikasi:

- 36 sampai 48 item.
- Estimasi 5 sampai 8 menit.
- Likert 5 poin.
- Hasil lebih ringkas.
- Confidence cenderung medium.
- Bisa menyarankan Standard Test bila hasil ambigu.

### 10.2 Standard Test

Tujuan:

- Default utama produk.
- Balance antara akurasi, detail, dan durasi.

Spesifikasi:

- 60 sampai 90 item.
- Estimasi 10 sampai 15 menit.
- Likert 5 poin.
- Menghasilkan trait, overlay, confidence, dan growth recommendation.
- Bisa memicu clarifier bila skor dekat batas.

### 10.3 Deep Test

Tujuan:

- Pengguna serius.
- Laporan lebih detail.

Spesifikasi:

- 120 item maksimal per sesi aktif.
- Estimasi 20 sampai 30 menit.
- Bisa dipecah menjadi beberapa sesi.
- Memiliki facet lebih detail.
- Cocok untuk premium report.

### 10.4 Clarifier Module

Tujuan:

- Memperjelas hasil ambigu.
- Mengurangi mistype pada dimensi mepet.

Trigger:

- Skor dimensi berada dekat threshold.
- Jawaban tidak konsisten.
- Dua tipe memiliki skor hampir sama.
- Response quality rendah.

Spesifikasi:

- 12 sampai 24 item.
- Muncul setelah assessment utama.
- User diberi pilihan untuk lanjut atau skip.
- Bila skip, hasil tetap diberikan dengan confidence lebih rendah.

---

## 11. Information Architecture

### 11.1 Public pages

- `/` Landing page.
- `/method` Penjelasan metode.
- `/modules` Daftar lensa kepribadian.
- `/pricing` Pricing, bisa hidden di MVP.
- `/privacy` Privacy policy.
- `/terms` Terms of service.
- `/disclaimer` Scientific dan clinical disclaimer.
- `/about` Tentang LensaDiri.
- `/contact` Kontak.
- `/blog` Artikel edukasi.
- `/blog/[slug]` Detail artikel.

### 11.2 Auth pages

- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/logout`

### 11.3 Assessment pages

- `/start`
- `/start/modules`
- `/start/consent`
- `/test/[sessionToken]`
- `/test/[sessionToken]/clarifier`
- `/test/[sessionToken]/complete`

### 11.4 Result pages

- `/result/[resultToken]`
- `/result/[resultToken]/share`
- `/result/[resultToken]/privacy`
- `/result/[resultToken]/export`

### 11.5 User dashboard

- `/dashboard`
- `/dashboard/results`
- `/dashboard/results/[id]`
- `/dashboard/settings`
- `/dashboard/privacy`
- `/dashboard/sessions`
- `/dashboard/delete-account`

### 11.6 Admin pages

- `/admin`
- `/admin/modules`
- `/admin/modules/[id]`
- `/admin/questions`
- `/admin/questions/new`
- `/admin/questions/[id]`
- `/admin/item-analytics`
- `/admin/scoring-versions`
- `/admin/content`
- `/admin/reports`
- `/admin/audit-logs`

---

## 12. Core User Flow

### 12.1 Guest flow

1. User membuka landing page.
2. User klik mulai tes.
3. User memilih Quick atau Standard.
4. User melihat penjelasan privasi dan consent.
5. User mulai mengisi assessment.
6. Sistem autosave jawaban.
7. User menyelesaikan assessment.
8. Server memvalidasi kelengkapan jawaban.
9. Server menghitung skor deterministik.
10. Server membuat result private.
11. User melihat hasil.
12. User bisa membuat share link eksplisit.
13. User bisa membuat akun untuk menyimpan hasil.
14. User bisa menghapus hasil.

### 12.2 Account flow

1. User register.
2. User verifikasi email.
3. User mulai assessment.
4. Result otomatis tersimpan di dashboard.
5. User bisa membandingkan hasil dari waktu ke waktu.
6. User bisa export data.
7. User bisa mencabut consent.
8. User bisa hapus akun.

### 12.3 Share flow

1. User membuka halaman hasil.
2. User klik bagikan.
3. Sistem menjelaskan data apa yang akan terlihat.
4. User memilih jenis sharing:
   - share card image only.
   - public preview link.
   - private link dengan token.
5. Server membuat token high entropy.
6. User bisa revoke atau rotate token.
7. Metadata halaman share tidak boleh menampilkan data private bila token tidak valid.

---

## 13. Functional Requirements

### 13.1 Landing Page

ID: FR-LP-001  
Prioritas: MVP  
Deskripsi: Landing page menjelaskan manfaat LensaDiri secara singkat dan jujur.

Acceptance criteria:

- Ada headline, subheadline, CTA mulai tes.
- Ada section cara kerja.
- Ada section lensa yang tersedia.
- Ada disclaimer pendek.
- Tidak ada testimonial palsu.
- Tidak ada angka pengguna palsu.
- Mobile-first dan cepat.

### 13.2 Module Selection

ID: FR-MOD-001  
Prioritas: MVP  
Deskripsi: User dapat melihat modul/lensa yang tersedia beserta evidence tier.

Acceptance criteria:

- Setiap modul punya nama, deskripsi, durasi, item count, evidence tier.
- User dapat memilih mode Quick atau Standard.
- MVP boleh membatasi kombinasi modul agar durasi aman.
- Sistem menampilkan estimasi durasi.

### 13.3 Consent Gate

ID: FR-CONSENT-001  
Prioritas: MVP  
Deskripsi: User harus memberi consent sebelum assessment.

Acceptance criteria:

- Consent menjelaskan tujuan pemrosesan data.
- Consent menjelaskan hasil bukan diagnosis.
- Consent menjelaskan mode guest dan akun.
- User bisa menolak.
- Consent disimpan dengan versi dokumen.

### 13.4 Test Runner

ID: FR-TEST-001  
Prioritas: MVP  
Deskripsi: User mengisi pertanyaan dengan UX mobile-first.

Acceptance criteria:

- Satu pertanyaan per layar atau batch kecil.
- Progress jelas.
- Tombol kembali dan lanjut.
- Autosave.
- Resume session.
- Error state aman.
- Mendukung keyboard dan screen reader.

### 13.5 Answer Sync

ID: FR-ANS-001  
Prioritas: MVP  
Deskripsi: Jawaban disimpan secara idempotent.

Acceptance criteria:

- Setiap jawaban memiliki idempotency key.
- Retry tidak membuat duplikasi.
- Race condition tidak menghapus jawaban terbaru.
- Server menolak question_id yang tidak termasuk session.
- Client tidak bisa mengirim skor final.

### 13.6 Completion

ID: FR-COMP-001  
Prioritas: MVP  
Deskripsi: Penyelesaian assessment harus atomic.

Acceptance criteria:

- Validasi kelengkapan jawaban.
- Hitung skor di transaction.
- Buat result dan dimension scores di transaction.
- Lock session sebagai completed.
- Tidak boleh ada session completed tanpa result.

### 13.7 Result Page

ID: FR-RES-001  
Prioritas: MVP  
Deskripsi: User melihat laporan hasil.

Acceptance criteria:

- Menampilkan ringkasan trait.
- Menampilkan overlay 16-Type, Enneagram, Temperament bila tersedia.
- Menampilkan confidence score.
- Menjelaskan batasan hasil.
- Menampilkan strengths, blind spots, communication style, growth tips.
- Private by default.

### 13.8 Share Card

ID: FR-SHARE-001  
Prioritas: MVP  
Deskripsi: User bisa membuat kartu hasil untuk dibagikan.

Acceptance criteria:

- User harus menekan aksi eksplisit.
- Card tidak menampilkan data sensitif berlebihan.
- Ada preview sebelum download/share.
- Share link bisa revoke.
- Share token high entropy.

### 13.9 Privacy Center

ID: FR-PRIV-001  
Prioritas: MVP  
Deskripsi: User bisa mengontrol data hasil.

Acceptance criteria:

- User bisa melihat status consent.
- User bisa delete result.
- User bisa export data JSON.
- User bisa revoke share link.
- User bisa delete account pada akun terdaftar.

### 13.10 Admin Item Bank

ID: FR-ADMIN-001  
Prioritas: V1  
Deskripsi: Admin bisa mengelola modul dan pertanyaan.

Acceptance criteria:

- Admin login role-protected.
- CRUD module.
- CRUD question.
- Versioning module.
- Preview scoring impact.
- Audit log semua perubahan.
- Metadata scoring tidak bocor ke user umum.

---

## 14. Non-Functional Requirements

### 14.1 Security

- RLS aktif pada tabel sensitif.
- Default deny.
- Tidak ada direct anon select ke personality_results.
- Tidak ada direct anon insert feedback.
- Semua operasi sensitif lewat server endpoint atau RPC strict.
- Rate limiting semua endpoint publik.
- CSRF protection untuk mutasi cookie-based.
- Password hashing Argon2id atau bcrypt dengan parameter kuat.
- Session token disimpan hash di database.
- Cookies httpOnly, secure, sameSite Lax atau Strict.
- Admin route fail closed.
- Audit log untuk admin dan operasi data sensitif.

### 14.2 Privacy

- Data minimization.
- Consent versioning.
- Purpose limitation.
- Delete data.
- Export data.
- Share explicit.
- Retention policy.
- No tracking invasive di MVP.
- IP dan user agent di-hash bila dipakai untuk rate limit.

### 14.3 Performance

Target MVP:

- Lighthouse Performance mobile minimal 85.
- Lighthouse Accessibility minimal 95.
- Lighthouse Best Practices minimal 95.
- Lighthouse SEO minimal 95 untuk public pages.
- LCP public page di bawah 2.5 detik pada koneksi wajar.
- JS landing page seminimal mungkin.
- Server components by default.
- Client components hanya untuk interaksi.

### 14.4 Accessibility

- Target WCAG 2.2 AA.
- Semua form memiliki label.
- Fokus keyboard jelas.
- Kontras warna cukup.
- Error message terhubung dengan input.
- Tidak mengandalkan warna saja.
- Motion bisa dikurangi.
- Screen reader friendly.

### 14.5 Reliability

- Autosave jawaban.
- Idempotent endpoints.
- Transactional completion.
- Graceful error recovery.
- No silent failure.
- Monitoring error.
- Backup database.

---

## 15. Product Modules

### 15.1 Module Registry

Setiap modul harus didefinisikan melalui registry:

```ts
type ModuleRegistryEntry = {
  key: string;
  name: string;
  publicName: string;
  description: string;
  evidenceTier: "A" | "B" | "C" | "EXPERIMENTAL";
  status: "draft" | "active" | "deprecated" | "retired";
  version: string;
  minItems: number;
  standardItems: number;
  maxItems: number;
  scoringStrategy: string;
  reportTemplateKey: string;
};
```

### 15.2 MVP modules

#### Big Five / Trait Profile

- Evidence tier: A.
- Status: core.
- Output: O, C, E, A, N score 0 sampai 100.
- Optional output: facet scores.
- Optional code: SLOAN-like label.
- Primary report sections: trait summary, strengths, blind spots, growth tips.

#### Jungian-inspired 16-Type

- Evidence tier: B.
- Status: overlay.
- Output: 4-letter style code based on continuous dimensions.
- Dimensions: E/I, S/N, T/F, J/P.
- Must show confidence per dimension.
- Must avoid absolute language.

#### Enneagram-inspired Motivation Lens

- Evidence tier: B.
- Status: overlay.
- Output: core type 1 sampai 9, wing if clear.
- Must show confidence and top alternatives.
- Must explain motivation pattern, not diagnosis.

#### Temperament Lens

- Evidence tier: B or C depending implementation.
- Status: simple overlay.
- Output: Sanguine, Choleric, Melancholic, Phlegmatic blend.
- Must be framed as style lens.

### 15.3 Future modules

#### RIASEC Career Interest

- Evidence tier: A/B depending implementation.
- Priority: V2.
- Use for career exploration, not job guarantee.

#### Attachment Style

- Evidence tier: B.
- Priority: V2.
- Use for relationship reflection.
- Must include careful disclaimer.

#### Instinctual Variant

- Evidence tier: B.
- Priority: V2.
- Self-preservation, social, one-to-one.

#### Socionics-inspired Lens

- Evidence tier: B/Experimental.
- Priority: V2.
- Use for communication and interaction patterns.

#### Psychosophy / Attitudinal Psyche

- Evidence tier: Experimental.
- Priority: V3.
- Use only as reflective content.

#### Symbolic Lens

- Evidence tier: C.
- Priority: V3.
- Fun cultural layer only.

---

## 16. Scoring Architecture

### 16.1 Prinsip scoring

- Scoring dilakukan server-side.
- Client hanya mengirim jawaban mentah.
- Setiap hasil terkait dengan module version.
- Scoring harus deterministic.
- Scoring harus dapat diaudit.
- AI tidak boleh mengubah skor primer.

### 16.2 Input scoring

Input:

- session_id.
- selected module versions.
- answered item list.
- response values 1 sampai 5.
- response timestamps.
- completion metadata.

### 16.3 Output scoring

Output:

- result_id.
- scoring_version.
- trait scores.
- overlay results.
- confidence score.
- response quality flags.
- report content keys.
- generated public summary DTO.

### 16.4 Likert scale

Default Likert 5 poin:

1. Sangat tidak sesuai.
2. Tidak sesuai.
3. Netral atau kadang sesuai.
4. Sesuai.
5. Sangat sesuai.

### 16.5 Reverse coding

Untuk item reverse-coded:

```ts
scoredValue = 6 - rawValue;
```

### 16.6 Weighted score

Setiap item memiliki:

- construct_key.
- facet_key.
- polarity.
- weight.
- module_version.

Score dihitung dengan weighted average, lalu dinormalisasi ke 0 sampai 100.

### 16.7 Confidence scoring

Confidence dipengaruhi:

- jumlah item terjawab.
- jarak skor dari threshold.
- konsistensi jawaban.
- response time terlalu cepat.
- straightlining.
- contradiction indicators.
- jumlah clarifier yang diselesaikan.

Contoh level:

- High: skor stabil dan tidak ambigu.
- Medium: ada sedikit ambiguitas.
- Low: skor dekat threshold atau kualitas jawaban rendah.

### 16.8 Response quality flags

Flags:

- too_fast.
- straightlining.
- inconsistent_pair.
- incomplete_optional.
- low_attention.
- ambiguous_profile.

Flags tidak boleh dipakai untuk menghukum user secara kasar. Gunakan untuk menjelaskan bahwa hasil mungkin kurang stabil.

### 16.9 Tension analysis

Bila dua modul terlihat bertentangan, sistem tidak boleh memaksa salah satu menjadi benar. Sistem menampilkan tension secara naratif.

Contoh:

- Trait menunjukkan social energy rendah, tetapi overlay komunikasi menunjukkan ekspresif pada konteks aman.
- Enneagram menunjukkan motivasi aman, tetapi 16-Type menunjukkan eksplorasi ide tinggi.

---

## 17. Report Architecture

### 17.1 Struktur laporan MVP

1. Hero result summary.
2. Confidence and evidence explanation.
3. Core trait profile.
4. 16-Type lens.
5. Enneagram motivation lens.
6. Temperament lens.
7. Strengths.
8. Blind spots.
9. Communication style.
10. Learning and work style.
11. Relationship reflection.
12. Growth tips 7 hari.
13. Share card.
14. Privacy controls.

### 17.2 Tone laporan

- Hangat.
- Tidak menghakimi.
- Tidak absolut.
- Menggunakan bahasa Indonesia natural.
- Boleh semi playful untuk Gen Z.
- Tetap profesional untuk bagian disclaimer.

### 17.3 Kata yang harus dihindari

- Pasti.
- Selalu.
- Tidak akan pernah.
- Tipe kamu mutlak.
- Diagnosis.
- Gangguan.
- Normal atau tidak normal.
- Akurat 100%.

### 17.4 Kata yang disarankan

- Cenderung.
- Dalam banyak situasi.
- Bisa jadi.
- Pola yang terlihat.
- Lensa refleksi.
- Arah pengembangan.
- Perlu dipahami sebagai gambaran, bukan batasan.

---

## 18. Data Model

### 18.1 Core tables

#### accounts

Menyimpan akun user.

Fields:

- id.
- email.
- email_normalized.
- password_hash.
- role.
- status.
- email_verified_at.
- created_at.
- updated_at.
- deleted_at.

#### account_sessions

Menyimpan sesi login.

Fields:

- id.
- account_id.
- session_token_hash.
- user_agent_hash.
- ip_hash.
- expires_at.
- revoked_at.
- created_at.

#### modules

Registry modul.

Fields:

- id.
- key.
- public_name.
- internal_name.
- evidence_tier.
- status.
- created_at.

#### module_versions

Versi modul.

Fields:

- id.
- module_id.
- version.
- scoring_strategy.
- status.
- published_at.
- retired_at.
- config_json.

#### question_dimensions

Metadata dimensi.

Fields:

- id.
- module_version_id.
- construct_key.
- facet_key.
- label.
- description.

#### questions

Item bank.

Fields:

- id.
- module_version_id.
- dimension_id.
- item_code.
- item_text_internal.
- polarity.
- weight.
- response_scale.
- status.
- created_at.
- updated_at.

#### question_translations

Lokalisasi item.

Fields:

- id.
- question_id.
- locale.
- public_text.
- helper_text.

#### test_sessions

Sesi assessment.

Fields:

- id.
- account_id nullable.
- guest_token_hash.
- status.
- mode.
- locale.
- consent_version.
- started_at.
- completed_at.
- expires_at.

#### test_session_modules

Modul yang dipilih dalam sesi.

Fields:

- id.
- session_id.
- module_version_id.
- item_count.
- status.

#### user_answers

Jawaban user.

Fields:

- id.
- session_id.
- question_id.
- raw_value.
- answered_at.
- response_time_ms.
- idempotency_key.
- created_at.
- updated_at.

Constraints:

- unique session_id, question_id.
- unique idempotency_key.

#### personality_results

Hasil utama.

Fields:

- id.
- account_id nullable.
- session_id.
- result_token_hash.
- visibility.
- scoring_version.
- summary_json.
- quality_json.
- created_at.
- updated_at.
- deleted_at.

#### dimension_scores

Skor dimensi.

Fields:

- id.
- result_id.
- module_key.
- construct_key.
- facet_key nullable.
- raw_score.
- normalized_score.
- confidence.
- created_at.

#### result_share_tokens

Token berbagi.

Fields:

- id.
- result_id.
- token_hash.
- public_scope.
- expires_at.
- revoked_at.
- created_at.

#### feedback

Feedback user.

Fields:

- id.
- result_id nullable.
- account_id nullable.
- rating.
- message.
- source.
- ip_hash.
- created_at.

#### consents

Consent log.

Fields:

- id.
- account_id nullable.
- session_id nullable.
- consent_type.
- version.
- accepted.
- accepted_at.
- revoked_at.

#### audit_logs

Audit admin dan operasi sensitif.

Fields:

- id.
- actor_account_id.
- action.
- entity_type.
- entity_id.
- metadata_json.
- created_at.

#### rate_limits

Rate limit.

Fields:

- id.
- key_hash.
- route_key.
- window_start.
- count.
- created_at.

---

## 19. API Plan

### 19.1 Public API

#### POST `/api/auth/register`

Register akun.

Request:

- email.
- password.
- locale.

Response:

- success.
- verification_required.

#### POST `/api/auth/login`

Login akun.

Request:

- email.
- password.

Response:

- success.
- session created via cookie.

#### POST `/api/auth/logout`

Logout sesi aktif.

#### GET `/api/modules`

Mengambil daftar modul publik.

Response harus hanya berisi public fields.

#### POST `/api/assessment/start`

Membuat session baru.

Request:

- mode.
- selected_modules.
- locale.
- consent_acceptance.

Response:

- session_token.
- first_question_batch.

#### GET `/api/assessment/:sessionToken`

Resume session.

Response:

- session status.
- progress.
- next questions.

#### PUT `/api/assessment/:sessionToken/answers`

Sync jawaban.

Request:

- answers array.
- idempotency keys.

Response:

- saved count.
- progress.

#### POST `/api/assessment/:sessionToken/complete`

Complete session dan scoring.

Response:

- result_token.
- status.

#### GET `/api/results/:resultToken`

Baca result milik user atau guest valid.

Response:

- private DTO bila authorized.
- public DTO bila token share valid.

#### POST `/api/results/:resultToken/share`

Buat share token.

#### DELETE `/api/results/:resultToken/share/:shareId`

Revoke share token.

#### POST `/api/feedback`

Submit feedback tervalidasi.

#### DELETE `/api/results/:resultToken`

Soft delete result.

#### GET `/api/export/me`

Export data user JSON.

### 19.2 Admin API

Semua admin endpoint wajib role-protected.

- GET `/api/admin/modules`
- POST `/api/admin/modules`
- PATCH `/api/admin/modules/:id`
- GET `/api/admin/questions`
- POST `/api/admin/questions`
- PATCH `/api/admin/questions/:id`
- GET `/api/admin/item-analytics`
- GET `/api/admin/audit-logs`
- POST `/api/admin/scoring/publish-version`

---

## 20. Security Architecture

### 20.1 Authentication

- Internal auth.
- Email and password.
- Password hash Argon2id preferred, bcrypt acceptable if Argon2id not available.
- Session token random high entropy.
- Session token stored as hash.
- Cookie httpOnly, secure, sameSite.
- Email verification required for dashboard persistence.
- Password reset token stored as hash.

### 20.2 Authorization

Roles:

- guest.
- user.
- admin.
- super_admin.

Rules:

- Guest can access only session/result with valid token.
- User can access own results.
- Admin can manage content but not casually read private results unless explicit support permission exists.
- Super admin can manage system config.

### 20.3 RLS Strategy

Principles:

- Enable RLS on sensitive tables.
- Default deny.
- No broad anon select.
- No direct public insert feedback.
- Server-side service role only in trusted environment.
- Public reads through strict DTO endpoint or RPC.

Sensitive tables:

- accounts.
- account_sessions.
- test_sessions.
- user_answers.
- personality_results.
- dimension_scores.
- result_share_tokens.
- consents.
- audit_logs.

### 20.4 Share Token Security

Requirements:

- Token minimal 128-bit entropy, recommended 256-bit.
- Store only hash.
- Expiration supported.
- Revocation supported.
- Rotation supported.
- Scope supported:
  - card_only.
  - public_preview.
  - full_private_link.
- Rate limited.
- No enumeration.

### 20.5 Metadata Privacy

Rules:

- Private result pages must noindex.
- Missing, revoked, expired token returns generic metadata.
- OG image generation must validate token and scope.
- Never expose internal IDs in metadata.

### 20.6 Feedback Protection

Rules:

- Feedback only through API.
- Validate length.
- Validate rating range.
- Rate limit by hashed IP/session.
- Honeypot optional.
- Store origin safely.

---

## 21. Privacy and Compliance

### 21.1 Data sensitivity

Personality result, answer pattern, and narrative report are treated as sensitive personal data. Product must minimize exposure and give user control.

### 21.2 Consent types

- assessment_processing.
- result_storage.
- research_optional.
- marketing_optional.
- ai_feature_optional.

### 21.3 User rights

MVP should support:

- Access result.
- Delete result.
- Export result.
- Revoke share.
- Withdraw optional consent.

V1 should support:

- Full account deletion.
- Export all account data.
- Session revoke.

### 21.4 Retention

Default proposal:

- Guest incomplete sessions expire after 30 days.
- Guest results expire or remain accessible only with token based on consent choice.
- Account results retained until user deletes.
- Rate limit logs retained 30 to 90 days.
- Audit logs retained longer for security.
- Deleted user data soft-deleted first, then hard-delete job based on policy.

---

## 22. AI Policy

### 22.1 Allowed AI usage

AI boleh digunakan untuk:

- Menjelaskan hasil dengan bahasa yang lebih personal berdasarkan skor yang sudah ada.
- Membuat growth tips dari template terkontrol.
- Membantu user memahami hasil.
- Membuat ringkasan share caption yang aman.

### 22.2 Forbidden AI usage

AI tidak boleh:

- Menghitung skor primer.
- Mengubah hasil scoring.
- Membuat diagnosis.
- Memberi saran medis atau klinis.
- Menyimpan chat sensitif tanpa consent.
- Mengklaim membaca pikiran user.

### 22.3 AI output guardrails

- Gunakan skor sebagai input read-only.
- Gunakan system prompt dengan larangan diagnosis.
- Gunakan template safety.
- Simpan log minimal.
- Consent khusus untuk fitur AI.
- Retention jelas.

---

## 23. UX Requirements

### 23.1 Visual direction

Brand feel:

- Clean.
- Soft futuristic.
- Calm.
- Trustworthy.
- Youthful but not childish.
- Gradient subtle.
- Banyak whitespace.
- Kartu hasil visual.

### 23.2 Design principles

- Mobile-first.
- Minimal friction.
- Progress visible.
- No dark pattern.
- Privacy explanation simple.
- Result page scannable.
- Share card estetik.
- Evidence tier mudah dipahami.

### 23.3 Main components

- App shell.
- Hero section.
- Module card.
- Evidence badge.
- Consent card.
- Question card.
- Likert selector.
- Progress bar.
- Result hero.
- Trait radar or bars.
- Confidence badge.
- Growth action card.
- Share preview card.
- Privacy control panel.

### 23.4 Empty states

- Belum ada hasil.
- Session expired.
- Result deleted.
- Share revoked.
- Network error.
- Maintenance mode.

### 23.5 Error states

Error message harus:

- Jelas.
- Tidak menyalahkan user.
- Tidak membocorkan detail internal.
- Memberi langkah berikutnya.

---

## 24. Content Requirements

### 24.1 Bahasa utama

- Bahasa Indonesia sebagai default.
- English sebagai V1/V2.

### 24.2 Style bahasa

- Semiformal.
- Natural.
- Ringan.
- Tidak kaku.
- Tidak menghakimi.
- Hindari jargon berlebihan.

### 24.3 Content library

Konten hasil harus disimpan sebagai template versioned.

Content categories:

- summary.
- strengths.
- blind_spots.
- communication.
- work_style.
- learning_preference.
- relationship_pattern.
- stress_pattern.
- growth_plan_7_days.
- growth_plan_30_days.

### 24.4 Item originality pipeline

Semua pertanyaan harus orisinal.

Rules:

- Jangan menyalin item dari instrumen proprietary.
- Tulis item berdasarkan konstruk, bukan meniru redaksi tes resmi.
- Simpan catatan konstruk untuk setiap item.
- Review item untuk bias budaya dan bahasa.
- Hindari pertanyaan terlalu klinis.

---

## 25. Admin and Internal Tools

### 25.1 Admin roles

- content_editor.
- psychometric_reviewer.
- admin.
- super_admin.

### 25.2 Admin capabilities MVP seed

MVP boleh memakai seed files dan SQL migrations untuk item bank.

### 25.3 Admin capabilities V1

- Manage modules.
- Manage questions.
- Manage translations.
- Preview result content.
- Publish module version.
- Retire module version.
- View item analytics.
- View feedback summary.

### 25.4 Audit log

Wajib log:

- Login admin.
- Create/update/delete item.
- Publish scoring version.
- Access sensitive admin page.
- Export internal analytics.

---

## 26. Analytics and Metrics

### 26.1 Product metrics

- Landing CTA click rate.
- Assessment start rate.
- Completion rate.
- Drop-off per question.
- Average completion time.
- Result share rate.
- Account conversion after result.
- Return user rate.

### 26.2 Psychometric metrics

- Item mean.
- Item variance.
- Missing rate.
- Response time distribution.
- Internal consistency estimate.
- Test-retest correlation, future.
- Factor analysis, future.
- Differential item functioning, future.

### 26.3 Business metrics

- Premium conversion.
- PDF purchase rate.
- Referral rate.
- CAC if ads used.
- Retention.

### 26.4 Privacy-safe analytics

- Avoid invasive tracking in MVP.
- Hash identifiers.
- Aggregate where possible.
- Do not send raw answers to third-party analytics.

---

## 27. Monetization Plan

### 27.1 MVP monetization

MVP can launch free without payment.

Free includes:

- Quick test.
- Standard result summary.
- Share card.

### 27.2 V1 monetization

Premium options:

- Deep report PDF.
- Growth plan 30 hari.
- Comparison result.
- Retest insight.

### 27.3 V2 monetization

- Career module premium.
- Relationship module premium.
- Bundle reports.
- Creator affiliate.

### 27.4 B2B later

B2B only after stronger validation and legal review.

Allowed positioning:

- Team reflection.
- Communication workshop.
- Learning style discussion.

Forbidden positioning:

- Hiring decision.
- Employee ranking.
- Mental health screening.

---

## 28. SEO Plan

### 28.1 Public SEO pages

- Apa itu tes kepribadian.
- Big Five explained.
- Jungian 16-Type explained.
- Enneagram explained.
- Temperament explained.
- Cara membaca hasil.
- Kenapa hasil tes bisa berubah.
- Tes kepribadian bukan diagnosis.

### 28.2 SEO rules

- Result pages noindex by default.
- Public marketing pages indexable.
- Avoid proprietary term misuse in title.
- Use educational content.
- Structured metadata only for public pages.

---

## 29. Technical Stack

### 29.1 Frontend

- Next.js App Router.
- React.
- TypeScript strict.
- Tailwind CSS.
- Server Components by default.
- Client Components only for test runner and interactive UI.

### 29.2 Backend

- Next.js Route Handlers or server actions.
- PostgreSQL via Supabase.
- SQL migrations.
- Database functions for critical scoring where useful.
- Zod or similar validation.

### 29.3 Auth

- Internal auth.
- Session cookie.
- Token hash storage.

### 29.4 Testing

- Vitest for unit.
- Playwright for e2e.
- Testing Library for components.
- Axe accessibility checks.

### 29.5 Deployment

- Vercel recommended for web.
- Supabase for PostgreSQL.
- GitHub Actions for CI.

---

## 30. Repository Structure

Target structure:

```txt
.
├── docs/
│   ├── product/
│   │   └── PRD_FULL_LensaDiri.md
│   ├── architecture/
│   ├── security/
│   ├── privacy/
│   └── qa/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── assessment/
│   │   ├── results/
│   │   ├── auth/
│   │   ├── admin/
│   │   └── privacy/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── scoring/
│   │   ├── modules/
│   │   ├── security/
│   │   └── validation/
│   ├── server/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seed/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/
│   └── workflows/
└── package.json
```

---

## 31. Implementation Phases

### Phase 0: Repo Bootstrap

Deliverables:

- Next.js app setup.
- TypeScript strict.
- Tailwind.
- ESLint.
- Prettier.
- Vitest.
- Playwright.
- Basic CI.
- Environment example.
- Security headers baseline.

Commands target:

```bash
npm create next-app@latest . -- --typescript --tailwind --eslint --app --src-dir
npm install zod
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright @playwright/test
npm run lint
npm run build
```

### Phase 1: Database and Auth Foundation

Deliverables:

- Supabase migration setup.
- Accounts table.
- Sessions table.
- Internal auth routes.
- Register, login, logout.
- Password hashing.
- Session cookies.
- CSRF protection.
- Rate limit table.

### Phase 2: Module Registry and Item Bank

Deliverables:

- modules.
- module_versions.
- question_dimensions.
- questions.
- question_translations.
- Seed MVP modules.
- Seed initial item bank.
- Public module endpoint.

### Phase 3: Assessment Flow

Deliverables:

- Start assessment.
- Consent gate.
- Test session.
- Test runner UI.
- Autosave.
- Resume.
- Answer sync endpoint.
- Progress calculation.

### Phase 4: Scoring Engine

Deliverables:

- Deterministic scoring.
- Big Five normalization.
- 16-Type overlay mapping.
- Enneagram scoring.
- Temperament scoring.
- Confidence scoring.
- Response quality flags.
- Atomic completion.

### Phase 5: Result Experience

Deliverables:

- Result page.
- Report sections.
- Evidence badges.
- Share card.
- Share token.
- Revoke share.
- Privacy controls.
- Delete result.

### Phase 6: Admin and QA

Deliverables:

- Admin route protection.
- Basic admin dashboard.
- Item management V1 or seed-only MVP.
- Unit tests.
- Integration tests.
- E2E tests.
- Accessibility tests.
- Security tests.

### Phase 7: Release Hardening

Deliverables:

- Lighthouse pass.
- CI green.
- npm audit high pass.
- Error monitoring setup.
- Backup plan.
- Privacy policy.
- Terms.
- Disclaimer.
- Launch checklist.

---

## 32. Backlog

### 32.1 P0

- Build fail-closed auth.
- Build RLS default deny.
- Prevent direct public read of results.
- Prevent direct public insert feedback.
- Implement consent gate.
- Implement server-side scoring.
- Implement idempotent answer sync.
- Implement atomic session completion.
- Implement private result default.
- Implement share token revoke.
- Implement metadata privacy.
- Remove all fake claims.
- Add security tests.

### 32.2 P1

- Build polished mobile test runner.
- Build result report.
- Add evidence badges.
- Add confidence explanation.
- Add export JSON.
- Add account dashboard.
- Add admin seed tooling.
- Add item analytics foundation.
- Add accessibility checks.
- Add performance budget.

### 32.3 P2

- Add blog content.
- Add PDF export.
- Add bilingual EN.
- Add growth plans 30 days.
- Add RIASEC.
- Add attachment style.
- Add premium flow.
- Add referral.

---

## 33. Testing Strategy

### 33.1 Unit tests

Test:

- scoring functions.
- reverse coding.
- normalization.
- confidence scoring.
- token hashing.
- validation schemas.
- content rendering helpers.

### 33.2 Integration tests

Test:

- start assessment.
- answer sync.
- complete assessment.
- result creation.
- share token creation.
- revoke share.
- delete result.
- auth session.

### 33.3 E2E tests

Test flows:

- Guest completes Quick Test.
- Guest resumes session.
- User registers and saves result.
- User revokes share link.
- Private result cannot be viewed publicly.
- Admin cannot be accessed by normal user.

### 33.4 Security tests

Test:

- anon cannot list personality_results.
- anon cannot insert feedback directly.
- invalid share token denied.
- expired share token denied.
- revoked share token denied.
- CSRF mutation denied.
- rate limit works.

### 33.5 Accessibility tests

Test:

- keyboard navigation.
- screen reader labels.
- form errors.
- color contrast.
- reduced motion.

---

## 34. Acceptance Criteria for MVP

MVP boleh disebut selesai bila:

1. User bisa mulai dan menyelesaikan Quick atau Standard Test.
2. Jawaban tersimpan aman dan idempotent.
3. Scoring berjalan server-side dan deterministic.
4. Result dibuat secara atomic.
5. Result private by default.
6. User bisa membuat dan mencabut share link.
7. Public share hanya menampilkan DTO aman.
8. Consent tersimpan.
9. User bisa delete result.
10. Tidak ada klaim ilmiah berlebihan.
11. Tidak ada testimonial atau angka palsu.
12. Landing, test, dan result mobile-friendly.
13. Accessibility baseline lolos.
14. Lint, typecheck, test, build pass.
15. Security tests untuk akses publik pass.
16. Privacy policy, terms, dan disclaimer tersedia.

---

## 35. Definition of Done

Setiap fitur dianggap done bila:

- Requirement terpenuhi.
- Validasi input ada.
- Error state ada.
- Loading state ada.
- Empty state ada jika relevan.
- Unit atau integration test ada.
- Accessibility diperiksa.
- Tidak membuka data sensitif.
- Tidak menambah klaim palsu.
- Dokumentasi diperbarui bila perlu.
- CI pass.

---

## 36. Environment Variables

Target `.env.example`:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_SESSION_SECRET=
CSRF_SECRET=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
RATE_LIMIT_SECRET=
```

Rules:

- Jangan commit `.env`.
- Jangan expose service role key ke client.
- Semua env production wajib diverifikasi sebelum deploy.

---

## 37. Release Checklist

Pre-launch:

- `npm ci` pass.
- `npm run lint` pass.
- `npm run typecheck` pass.
- `npm test` pass.
- `npm run build` pass.
- `npm run test:e2e` pass.
- npm audit high pass.
- Supabase migrations applied.
- RLS verified.
- Security headers verified.
- Lighthouse mobile checked.
- Privacy policy live.
- Terms live.
- Disclaimer live.
- Share metadata privacy verified.
- Backup configured.
- Error monitoring configured.

---

## 38. Risks and Mitigations

### 38.1 Scientific overclaim

Risk: produk dianggap mengklaim diagnosis atau akurasi tinggi.

Mitigation:

- Evidence badge.
- Disclaimer.
- Careful copywriting.
- Technical manual roadmap.

### 38.2 Legal trademark risk

Risk: penggunaan istilah proprietary.

Mitigation:

- Gunakan nama generik aman.
- Hindari item proprietary.
- Review copy sebelum launch.

### 38.3 Privacy leak

Risk: hasil user terbuka.

Mitigation:

- Private by default.
- Share token hash.
- RLS default deny.
- Metadata noindex.
- Security tests.

### 38.4 Test fatigue

Risk: user drop-off.

Mitigation:

- Quick mode.
- Progress clear.
- Autosave.
- Standard item count realistis.

### 38.5 Low result confidence

Risk: hasil terasa tidak cocok.

Mitigation:

- Clarifier.
- Confidence explanation.
- Feedback loop.
- Better item analytics.

---

## 39. Roadmap Validasi Psikometrik

### 39.1 Pre-pilot

- Tulis konstruk.
- Tulis item original.
- Review bahasa.
- Review bias budaya.
- Review legal.

### 39.2 Pilot 1

- Kumpulkan response awal.
- Analisis distribusi item.
- Drop item buruk.
- Cek internal consistency awal.

### 39.3 Pilot 2

- Tambah sampel.
- EFA untuk struktur faktor.
- Analisis korelasi antar modul.
- Revisi item.

### 39.4 Validation phase

- CFA bila data cukup.
- Test-retest.
- DIF.
- Norming awal.
- Technical manual draft.

### 39.5 Public claims update

Klaim publik hanya boleh ditingkatkan setelah data validasi cukup.

---

## 40. Final Product Direction

LensaDiri harus dibangun sebagai platform yang rapi secara teknis, jujur secara ilmiah, dan menyenangkan secara UX. Kekuatan utamanya bukan sekadar memberi label kepribadian, tetapi memberi pengguna cara memahami dirinya melalui banyak lensa tanpa mengunci mereka pada identitas yang kaku.

Build pertama harus memprioritaskan:

1. Trust.
2. Privacy.
3. Completion rate.
4. Deterministic scoring.
5. Result clarity.
6. Shareability yang aman.
7. Maintainable architecture.

Setelah fondasi ini kuat, produk dapat berkembang ke premium report, modul karier, modul relasi, growth plan, validasi formal, dan engine modular yang lebih luas.

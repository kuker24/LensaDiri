# PRD v2 Production Activation Readiness

> **Status**: READY_FOR_APPROVAL — engineering dan dokumentasi siap, aktivasi produksi belum dijalankan.
> **Branch**: `agent/prd-v2-production-activation-readiness`
> **Base**: `main` (merge commit `5c84f25`)
> **Tanggal**: 2026-07-18

---

## 1. Current State

| Item                           | Status                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRD v2 functional code         | Merged to `main` via PR #12 (SHA `5c84f25`)                                                                                                                    |
| Production URL                 | `https://lensadiri.vercel.app`                                                                                                                                 |
| Vercel production deployment   | `dpl_3sjiYH9zkF3tbBZ8x6FABGHZgAUN` — **Ready**                                                                                                                 |
| Production commit              | `5c84f25c8b531344deaa86cd73ccdb53590f0311`                                                                                                                     |
| `/api/health` smoke            | `{"status":"ok"}` — HTTP 200                                                                                                                                   |
| Public routes smoke            | `/`, `/modules`, `/combos`, `/start`, `/privacy`, `/terms`, `/disclaimer` — seluruhnya 200                                                                     |
| Feature flags production       | Checkpoint terakhir terdokumentasi: **semua OFF** (`enabled = false`). Tidak di-query ulang pada audit read-only ini karena production database tidak disentuh |
| Module release-ready           | Trait Profile (`active`), 16-Type, Enneagram, Temperament (`published`) — selectable                                                                           |
| Module deferred                | attachment, instinct, riasec, socionics_communication, three_center (`draft`), psychosophy (`experimental`) — non-selectable                                   |
| Feature flag rows (production) | `FEATURE_MODULAR_COMPOSER` (OFF), `FEATURE_COMPLEX_MODE` (OFF), `FEATURE_PROVISIONAL_PRECISION` (OFF), `FEATURE_AI_NARRATIVE` (OFF)                            |
| Production database migration  | Applied sampai `202607200001`                                                                                                                                  |
| Pending migration              | `202607200002_quality_model_version.sql` — belum diterapkan                                                                                                    |
| Production modular seed        | **Belum dijalankan**                                                                                                                                           |
| Email provider production      | Belum aktif                                                                                                                                                    |
| Admin/operator routes          | Read-only, fail-closed guard aktif                                                                                                                             |
| Dashboard/result boundary      | Opaque token + hashing, ownership guard, private-by-default                                                                                                    |

### Known pending actions

- Migration `202607200002` belum diterapkan ke production.
- Modular content seed belum dijalankan ke production.
- Modular feature flags belum aktif.
- Email verification tidak mandatory (provider belum live).
- Backup/restore drill belum pernah dilakukan di hosted Supabase.
- Staging terpisah, monitoring provider, dan formal WCAG audit belum tersedia.

---

## 2. Production Activation Preconditions

Setiap langkah membutuhkan approval eksplisit. Checklist:

- [ ] **Logical backup production** — buat permission-restricted logical schema/data/roles export melalui tooling yang didukung Supabase sebelum migration atau content write. Simpan di luar repository dan verifikasi manifest SHA-256 tanpa mencetak credential.
- [ ] **Restore drill** — belum tersedia tanpa isolated project. Mitigasi sementara: verifikasi backup dan manifest secara independen, lalu gunakan additive fix-forward jika ada masalah. Kondisi ini harus diterima secara eksplisit sebagai residual risk.
- [ ] **Migration `202607200002`** — isi, dependency, lock profile, postcheck sudah direview di dokumentasi ini (lihat §3).
- [ ] **Migration dry-run** — jalankan `supabase db push --linked --dry-run` dan bandingkan output dengan expected migration list.
- [ ] **Migration postcheck SQL** — siap untuk dijalankan setelah apply (lihat §3).
- [ ] **Seed publication plan** — direview (lihat §4). Tidak ada account/password/token/secret dalam seed.
- [ ] **Feature flags tetap OFF setelah migration/seed** — diverifikasi melalui query flag table setelah setiap langkah.
- [ ] **Rollback plan** — terdokumentasi (lihat §7). Vercel alias dan fix-forward migration.
- [ ] **Monitoring/log review** — Vercel function logs, Supabase query insights.
- [ ] **Smoke test script** — siap untuk dijalankan (lihat `scripts/production-smoke-readonly.mjs`).
- [ ] **Approval eksplisit** — diperlukan untuk: migration window, content publication, dan setiap feature flag toggle.

---

## 3. Pending Migration Plan

### File

`supabase/migrations/202607200002_quality_model_version.sql`

### Tujuan

Menambahkan `assessment_blueprints.quality_model_version text not null default 'module-quality-1'` dengan CHECK constraint `('module-quality-1', 'module-quality-2')`. Kolom ini memungkinkan scoring confidence memilih set faktor versioned (`module-quality-1` untuk legacy, `module-quality-2` untuk modular baru).

### Dependency

Membutuhkan table `assessment_blueprints` (dari migration `202607130006`). Sudah terpenuhi di production.

### Efek schema

- `ALTER TABLE public.assessment_blueprints ADD COLUMN quality_model_version text not null default 'module-quality-1'`
- `ALTER TABLE public.assessment_blueprints ADD CONSTRAINT assessment_blueprints_quality_model_version CHECK (...)`

### Backfill

- Existing blueprints backfill ke `'module-quality-1'` via default column tanpa row-by-row loop (constant default).
- Backfill bersifat byte-identical — tidak mengubah angka skor.

### Lock profile

- `ALTER TABLE` mengambil metadata lock. Durasi aktual tetap bergantung pada transaksi aktif dan ukuran tabel saat CHECK constraint divalidasi.
- PostgreSQL 15 dapat menambahkan constant non-volatile default tanpa full table rewrite.
- Jalankan pada maintenance window singkat dan hentikan proses bila lock wait atau latency melewati batas operator.

### Rollback / Fix-forward

- **Additive fix-forward only**. Migration tidak boleh di-revert secara destruktif.
- Jika kendala muncul, tambahkan migration baru (contoh: menyesuaikan CHECK constraint, menambah nilai yang diizinkan).
- Prefer `ALTER TABLE ... ALTER COLUMN ... DROP DEFAULT` jika default tidak diperlukan, tetapi hal ini tidak mendesak.

### Postcheck SQL (setelah apply)

```sql
-- verifikasi column dan constraint
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'assessment_blueprints'
  and column_name = 'quality_model_version';

select constraint_name, constraint_type, check_clause
from information_schema.table_constraints tc
join information_schema.check_constraints cc on tc.constraint_name = cc.constraint_name
where tc.table_name = 'assessment_blueprints'
  and tc.constraint_name = 'assessment_blueprints_quality_model_version';

-- verifikasi backfill
select quality_model_version, count(*)
from public.assessment_blueprints
group by quality_model_version
order by quality_model_version;
-- expected: 'module-quality-1' dengan jumlah semua blueprint yang ada, tidak ada nilai lain

-- verifikasi constraint rejects invalid value
-- (query hanya untuk verifikasi, dijalankan dalam transaksi read-only)
-- select * from public.assessment_blueprints
-- where quality_model_version not in ('module-quality-1', 'module-quality-2');
-- expected: empty

-- verifikasi constraint active
select true as constraint_active
from information_schema.check_constraints
where constraint_name = 'assessment_blueprints_quality_model_version'
  and constraint_schema = 'public';
```

### Mengapa harus sebelum modular flag ON

Modular completion path (`assessment_blueprints.quality_model_version`) digunakan untuk memilih set faktor confidence versioned. Tanpa migration ini, kode scoring untuk sesi modular baru akan gagal membaca kolom yang belum ada. Migration wajib mendahului aktivasi `FEATURE_MODULAR_COMPOSER`.

---

## 4. Seed Publication Plan

### Seed file

| File                                                     | Tujuan                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `supabase/seed/20260713_mvp_item_bank.sql`               | Legacy MVP question bank                                                  |
| `supabase/seed/20260714_modular_catalog.sql`             | Module/version/dimension/question definitions + feature flags default OFF |
| `supabase/seed/20260715_independent_core_modules.sql`    | Core independent module definitions                                       |
| `supabase/seed/20260716_trait_profile_modular.sql`       | Trait Profile modular items                                               |
| `supabase/seed/20260716_release_catalog.sql`             | Release disposition, combo presets, retention policies                    |
| `supabase/seed/20260726_deferred_modules_item_banks.sql` | Draft item banks untuk 6 modul deferred                                   |

### Canonical seed counts (dari seed replay lokal)

| Entity            | Count |
| ----------------- | ----- |
| `modules`         | 10    |
| `module_versions` | 11    |
| `dimensions`      | 49    |
| `questions`       | 405   |
| `translations`    | 405   |
| `mappings`        | 405   |
| `combo_presets`   | 6     |
| `combo_mappings`  | 19    |

### Canonical seed identity

- SHA-256 dari combinatorial check: `b5baf175d1eea4478d7acffe9d4cb00976e95a9510afda2d52d736e693b5c501`
- Verifikasi: `npm run test:seed-replay` PASS pada disposable local

### Aturan publikasi

- **Production seed hanya setelah approval eksplisit** oleh product owner dan reviewer.
- Seed publikasi dilakukan melalui **migration additive** (bukan `supabase db push` dari seed path). Salin logic seed ke migration baru dengan target `public.modules`, `public.module_versions`, dll.
- **Tidak ada account, password, token, secret, production identifier, user record, atau production export** dalam seed manapun.
- Canonical counts diverifikasi ulang dari production setelah publikasi. Jangan menambahkan entity di luar canonical seed yang sudah lulus review.
- Modul deferred (`draft`/`experimental`) tetap non-selectable dan diblokir oleh publication gate (`transition_question_review`).

---

## 5. Feature Flag Activation Plan

### Urutan bertahap

Setiap tahap membutuhkan approval eksplisit terpisah.

| Tahap | Aksi                                                                                      | Prasyarat                                                                   | Batasan                                                                                                                                            |
| ----- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Pertahankan semua flag OFF setelah migration dan content publication                      | Postcheck migration, seed counts, RLS, grants, dan legacy smoke lulus       | Tidak ada aktivasi pengguna                                                                                                                        |
| 2     | Verifikasi catalog modular dan estimate secara read-only selagi composer masih OFF        | Tahap 1 selesai                                                             | Memastikan fail-closed dan baseline public tetap sehat                                                                                             |
| 3     | Aktifkan `FEATURE_MODULAR_COMPOSER` untuk pilot internal terkontrol                       | Approval eksplisit, akun test, owner monitoring, rollback owner             | Flag yang sama membuka catalog, estimate, dan start. Belum ada cohort flag terpisah, sehingga akses internal harus dikendalikan secara operasional |
| 4     | Uji runner Normal, autosave, resume, completion, private result, share/revoke, dan export | Tahap 3 stabil                                                              | Clarifier mengikuti lifecycle composer dan diuji setelah runner/result dasar stabil                                                                |
| 5     | Aktifkan `FEATURE_COMPLEX_MODE` terakhir                                                  | Pilot composer dan clarifier stabil                                         | Complex menambah segmentasi dan panjang sesi                                                                                                       |
| 6     | Pertimbangkan `FEATURE_PROVISIONAL_PRECISION`                                             | Disclaimer dan quality display diverifikasi                                 | Tidak wajib untuk aktivasi composer                                                                                                                |
| 7     | Pertahankan `FEATURE_AI_NARRATIVE` OFF                                                    | Provider, consent, minimization, fallback, dan safety template belum matang | AI tidak boleh menghitung atau mengubah skor primer                                                                                                |

### Aturan

- **Tidak pernah mengaktifkan lebih dari satu flag per approval cycle.**
- Setiap aktivasi didahului smoke test dan diikuti monitoring.
- Flag dinonaktifkan kembali jika smoke test gagal.
- Flag diubah melalui trusted compare-and-set boundary terhadap tabel `feature_flags`, bukan environment variable.
- Karena tidak ada flag khusus catalog/estimate atau cohort rollout, `FEATURE_MODULAR_COMPOSER` tidak boleh disebut sebagai read-only activation. Pilot internal memerlukan akses yang dikendalikan operator dan akun test khusus.
- `FEATURE_AI_NARRATIVE` memiliki `configuration_json` `requiresConsent:true` dan `primaryScoringForbidden:true`. Flag tetap OFF sampai seluruh external gate dipenuhi.

---

## 6. Smoke Test Plan After Activation

### Non-destructive (read-only, tanpa autentikasi)

| Endpoint             | Expected                 | Catatan                               |
| -------------------- | ------------------------ | ------------------------------------- |
| `GET /api/health`    | `{"status":"ok"}` — 200  | Liveness sederhana                    |
| `GET /modules`       | 200, daftar modul        | -                                     |
| `GET /combos`        | 200, daftar preset       | -                                     |
| `GET /start/modules` | 200, halaman pilih modul | Setelah `FEATURE_MODULAR_COMPOSER` ON |
| `HEAD /*` public     | 200                      | No 5xx                                |

### Dengan akun test

| Endpoint                         | Expected                     | Mutasi?              |
| -------------------------------- | ---------------------------- | -------------------- |
| `POST /api/auth/register`        | 201 + session                | Register (write)     |
| `POST /api/assessment/estimate`  | 200, estimate payload        | Read-only (estimate) |
| `POST /api/assessment/start`     | 201, token                   | Start (write)        |
| `POST /api/assessment/answer`    | 200, next item               | Autosave (write)     |
| `POST /api/assessment/pause`     | 200, state                   | Pause (write)        |
| `POST /api/assessment/resume`    | 200, session                 | Resume (write)       |
| `POST /api/assessment/complete`  | 200, result token            | Complete (write)     |
| `GET /result/[token]`            | 200, report                  | Read                 |
| `POST /api/result/share`         | 200, share token             | Share (write)        |
| `POST /api/result/revoke`        | 200, revoked                 | Revoke (write)       |
| `GET /shared/[token]`            | 200, shared view             | Read (public)        |
| `GET /api/result/export/[token]` | 200, JSON                    | Read                 |
| `POST /api/result/delete`        | 200, deleted                 | Delete (write)       |
| `GET /dashboard`                 | 200, session list            | Read                 |
| `GET /admin/*`                   | 403/redirect untuk non-admin | Fail-closed          |

### Operator

| Langkah                         | Detail                                        |
| ------------------------------- | --------------------------------------------- |
| Monitoring Vercel Function Logs | 15 menit setelah setiap aktivasi              |
| Supabase Query Insights         | Periksa slow query, error rate, RLS violation |

### Stop condition

- Error rate > 1% dari baseline.
- Route yang sebelumnya 200 menjadi 5xx.
- RLS violation terdeteksi di audit logs.
- Token hashing mismatch.
- Scoring result berbeda secara signifikan dari snapshot expected.

---

## 7. Rollback Plan

### Application rollback (Vercel)

- **Rollback utama**: set feature flag OFF melalui database operator query (compare-and-set).
- **Rollback deployment**: promote previous healthy Vercel production deployment via Vercel Dashboard → Deployment → ⋮ → Promote to Production.
- Production alias `lensadiri.vercel.app` tetap menunjuk ke deployment aktif sampai alias dipromosikan.
- Previous healthy deployment ID: `dpl_C5miY5hwXuz68fmP7JESVbvqrhBm` (pre-PR#12 baseline).
- **Catatan**: Vercel rollback tidak mengembalikan schema/flag database. Flag harus di-set OFF secara manual.

### Database rollback

- **Additive fix-forward only**. Tidak ada destructive rollback.
- Jika migration `202607200002` menyebabkan masalah: tambahkan migration baru yang memperbaiki tanpa menghapus kolom/constraint.
- Jika seed content salah (misal question typo): migration additive untuk memperbaiki text, bukan menghapus row.
- Jika feature flag menyebabkan data korupsi: set flag OFF, perbaiki data melalui additive migration dengan kondisi yang tepat.

### Stop conditions

- Error rate meningkat > 2% dalam 15 menit setelah aktivasi.
- RLS atau authorization abnormal (non-admin bisa mengakses admin route, dll).
- Scoring/result mismatch — hasil modul baru berbeda secara fundamental dari snapshot test Candidate lokal.
- Public DTO secara tidak sengaja mengekspos quality diagnostics, timing, token hash, atau clarifier data.

---

## 8. Risk Register

| Risiko                                               | Dampak                                                            | Mitigasi                                                                                         | Status                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Supabase Free tanpa staging                          | Tidak bisa uji migration/seed secara realistis sebelum production | Dry-run, logical backup diverifikasi, additive fix-forward, smoke test ketat                     | **DITERIMA**                                                        |
| Migration `202607200002` applied tanpa restore drill | Recovery path tidak terverifikasi di hosted environment           | Backup diverifikasi secara independen sebelum apply                                              | **DITERIMA** — restore drill tetap blocked tanpa project terisolasi |
| Seed publication salah (duplikat/typo)               | Duplicate key error atau konten salah di production               | Canonical count diverifikasi + seed replay lulus lokal; production seed lewat migration additive | **MITIGATED**                                                       |
| Feature flag ON terlalu cepat                        | UI modular muncul tanpa backend siap                              | Migration `202607200002` wajib sebelum flag ON; aktivasi gradual dengan approval                 | **MITIGATED**                                                       |
| Scoring/result mismatch                              | Pengguna mendapat hasil tidak konsisten                           | Unit + integration test lulus; replay deterministik; snapshot versioned                          | **MITIGATED**                                                       |
| Public DTO leak                                      | Quality diagnostics atau clarifier data terekspos publik          | Allowlist eksplisit `toSafeSharedResultView()`; pgTAP memverifikasi                              | **MITIGATED**                                                       |
| Admin route exposure                                 | Non-admin bisa mengakses `/admin/*`                               | `requireAdminSession()` fail-closed; hanya read-only                                             | **MITIGATED**                                                       |
| Vercel rollback tidak mengubah schema                | Application rollback tetap di schema baru, state inkonsisten      | Feature flag OFF adalah rollback utama; Vercel rollback digunakan hanya untuk UI/runtime bug     | **DITERIMA**                                                        |
| Email provider belum live                            | Tidak ada password reset / email verification                     | Login tetap bekerja tanpa verifikasi; recovery foundation dormant                                | **DITERIMA**                                                        |
| Formal psychometric validation belum                 | Produk tidak bisa diklaim sebagai instrumen valid                 | Evidence tier transparan; "reflektif — bukan diagnosis" di setiap hasil                          | **DITERIMA**                                                        |
| Modul deferred tanpa review bahasa/konstruk/bias     | Item tidak natural atau bias populasi                             | Non-selectable (`is_selectable=false`, `draft`/`experimental`). Publication gate memblokir       | **MITIGATED**                                                       |

---

## 9. Go / No-Go Verdict

**READY_FOR_APPROVAL** — semua precondition engineering sudah siap dan terverifikasi secara lokal, dokumentasi readiness lengkap, smoke test production lulus. Namun aktivasi fitur modular (`FEATURE_MODULAR_COMPOSER`, `FEATURE_COMPLEX_MODE`) di production **belum dijalankan** dan memerlukan approval eksplisit untuk setiap langkah berikut:

1. Migration `202607200002` ke production
2. Modular content publication ke production
3. Setiap toggle feature flag secara terpisah

**Status saat ini: NOT_ACTIVATED.**

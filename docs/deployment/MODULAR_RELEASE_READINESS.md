# Modular Release Readiness

Gate aktivasi modular LensaDiri. Migration schema readiness ada di `PRD_V2_MIGRATION_READINESS.md` dan `PRODUCTION_MIGRATION_MAP.md`.

## Posture saat ini

> Direkonsiliasi 2026-07-22 dari bukti aktual read-only: `supabase migration list --linked` dan halaman publik production. Bukti mengoreksi klaim lama "hanya empat modul selectable" dan "`202607270001` pending".

- Base modular schema dan quality-model provenance sampai `202607200002`: applied ke production pada activation task sebelumnya.
- Migration `202607270001_guarded_all_lenses_release.sql` **sudah applied ke production**. `supabase migration list --linked` (2026-07-22) menampilkan versi ini pada kolom Remote, sejajar dengan Local.
- Canonical modular content 10 modul ada di production dan **kesepuluhnya selectable**. Halaman publik `/modules/<key>` untuk seluruh modul (termasuk `socionics_communication` dan `psychosophy` experimental) merender CTA `Pilih modul ini` → `/start/modules?module=<key>`, dan `/combos` menyajikan preset Beta serta Eksperimental.
- `FEATURE_MODULAR_COMPOSER` production aktif. `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, dan `FEATURE_AI_NARRATIVE` tetap OFF menurut checkpoint terakhir; flag table tidak di-query ulang pada audit read-only ini.
- Legacy Quick 40/Standard 60 tetap backward-compatible.
- Migration `202607270001` sudah masuk `main` melalui PR #15 (merge `9ff30cf`, 2026-07-19). Branch `agent/complete-all-lenses-release-ready` bukan lagi satu-satunya pemilik kandidat ini.

## Release-ready modules

| Module        | Key                       | Status         | Selectable |
| ------------- | ------------------------- | -------------- | ---------- |
| Trait Profile | `trait_profile`           | `active`       | ya         |
| 16-Type       | `type_16`                 | `published`    | ya         |
| Enneagram     | `enneagram`               | `published`    | ya         |
| Temperament   | `temperament`             | `published`    | ya         |
| Three Center  | `three_center`            | `pilot`        | ya         |
| Instinct      | `instinct`                | `pilot`        | ya         |
| RIASEC        | `riasec`                  | `pilot`        | ya         |
| Attachment    | `attachment`              | `pilot`        | ya         |
| Socionics     | `socionics_communication` | `experimental` | ya         |
| Psychosophy   | `psychosophy`             | `experimental` | ya         |

## Guarded beta and experimental rollout

Semua sepuluh modul kini `is_selectable=true` dengan status jujur per modul:

- Modul orisinal: `published` / `active`.
- Modul baru: `pilot` (tiga pusat, instingtual variant, RIASEC, attachment) atau `experimental` (Socionics komunikasi, psychosophy).
- Item dan terjemahan tetap `draft`. Akses beta ditandai eksplisit oleh `config_json.guardedBeta=true`, sehingga tidak memalsukan review formal.
- Preset `deep_self_discovery` dan `full_spectrum` tetap disembunyikan (`draft`) karena target item melebihi kapasitas mode standard, atau mode Complex belum aktif. Custom combo tetap didukung.

Setiap modul sudah memiliki scoring engine independen (test-covered) dan item bank Bahasa Indonesia yang telah melewati audit bahasa awal non-klinis. Modul eksperimental memicu consent checkbox khusus sebelum memulai sesi, dan Attachment memiliki filter usia minimum 18 tahun.

## Activation status (production)

Jalur guarded all-lenses **sudah aktif di production**. Migration `202607270001_guarded_all_lenses_release.sql` telah applied (terlihat pada kolom Remote `supabase migration list --linked`, 2026-07-22) dan mempromosikan enam lensa deferred ke status selectable guarded tanpa mengubah feature flag. Selectability terkonfirmasi dari halaman publik production.

Karena aktivasi enam lensa sudah terjadi, kondisi di bawah adalah **catatan historis kriteria yang berlaku sebelum apply** dan referensi untuk activation guarded berikutnya:

1. Backup logical schema, data, dan roles dibuat sebelum write serta manifest hash diverifikasi.
2. Dry-run linked hanya menampilkan `202607270001_guarded_all_lenses_release.sql`.
3. Postcheck memastikan 4 version `pilot`, 2 version `experimental`, 147 question/translation tetap `draft`, dan `guardedBeta=true` hanya pada enam version target.
4. Preview atau staging terisolasi digunakan bila tersedia. Jika tidak, risiko single-project harus dicatat eksplisit.
5. Monitoring provider dan rollback owner aktif.
6. `FEATURE_AI_NARRATIVE` tetap OFF. Perubahan flag lain memerlukan approval terpisah.

## Postcheck read-only (2026-07-22, SHA `51dc4e0`)

Metode: `supabase migration list --linked` plus production HTTP surfaces (`/api/modules`, `/api/combos`, `/api/assessment/estimate`, halaman publik). `psql`, Docker `db dump`, dan koneksi pooler tidak digunakan; kredensial database tidak disentuh. Batasan: query langsung ke tabel `questions`/`translations` untuk hitungan `review_status='draft'` dan `config_json.guardedBeta` per-version **belum** diverifikasi langsung karena tidak ada jalur read-only ke tabel konten tanpa kredensial. Item di bawah diverifikasi via kontrak API yang membaca production DB pada trusted server boundary.

| Target                          | Ekspektasi                                         | Hasil aktual (bukti)                                                                                                                                                                            | Status     |
| ------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Migration `202607270001`        | Applied di production                              | Ada pada kolom Remote `migration list --linked`                                                                                                                                                 | MATCH      |
| 10 modul selectable             | Semua `is_selectable=true`, `RELEASE_READY`        | `/api/modules` = 10 modul, semua `isSelectable=true`, `releaseDisposition=RELEASE_READY`                                                                                                        | MATCH      |
| 4 modul pilot                   | three_center, instinct, riasec, attachment         | `/api/modules` status `pilot` untuk keempatnya                                                                                                                                                  | MATCH      |
| 2 modul experimental            | socionics_communication, psychosophy               | `/api/modules` status `experimental`, `isExperimental=true`                                                                                                                                     | MATCH      |
| Age gate                        | attachment/psychosophy 18, enneagram/pilot lain 15 | `/api/modules` `minimumAge`: attachment 18, psychosophy 18, three_center/instinct/riasec/enneagram 15                                                                                           | MATCH      |
| Preset visible                  | 4 preset fit-coverage, deep/full_spectrum hidden   | `/api/combos` = core_personality (published), motivation_instinct (pilot), career_learning (pilot), communication_relationship (experimental); deep_self_discovery & full_spectrum tidak tampil | MATCH      |
| `FEATURE_MODULAR_COMPOSER`      | ON                                                 | estimate `standard` sukses (`itemCount 60`, `precision:null`); modular flow aktif                                                                                                               | MATCH      |
| `FEATURE_COMPLEX_MODE`          | OFF                                                | `/api/modules` mode `deep` `isSelectable=false`; estimate `mode:deep` → `mode_unavailable` (flag-derived)                                                                                       | MATCH      |
| `FEATURE_PROVISIONAL_PRECISION` | OFF                                                | estimate `standard` mengembalikan `precision:null` (aktif hanya jika flag ON)                                                                                                                   | MATCH      |
| `FEATURE_AI_NARRATIVE`          | OFF                                                | Tidak ada jalur publik; mempertahankan checkpoint. Tidak di-verifikasi ulang pada audit ini                                                                                                     | UNVERIFIED |

Kesimpulan: tidak ada drift antara dokumentasi dan bukti production yang dapat diamati read-only. Verifikasi yang masih terbuka (butuh kredensial atau approval): `review_status='draft'` untuk 147 item+translation enam modul, `config_json.guardedBeta=true` hanya pada enam version target, dan status flag `FEATURE_AI_NARRATIVE` langsung dari `feature_flags`.

## Verifikasi lokal sebelum activation

Flags hanya diaktifkan pada disposable local database untuk verifikasi:

```bash
npm run db:reset
docker exec supabase_db_lensa-diri psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "update public.feature_flags set enabled = true \
      where key in ('FEATURE_MODULAR_COMPOSER', 'FEATURE_COMPLEX_MODE')"
CI=1 npm run test:e2e
npm run test:a11y
```

Jangan pernah menjalankan perintah di atas terhadap production.

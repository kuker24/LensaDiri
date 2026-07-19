# Modular Release Readiness

Gate aktivasi modular LensaDiri. Migration schema readiness ada di `PRD_V2_MIGRATION_READINESS.md` dan `PRODUCTION_MIGRATION_MAP.md`.

## Posture saat ini

- Base modular schema dan quality-model provenance sampai `202607200002`: applied ke production pada activation task sebelumnya.
- Canonical modular content 10 modul sudah ada di production, tetapi hanya empat modul awal yang selectable.
- `FEATURE_MODULAR_COMPOSER` production aktif. `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, dan `FEATURE_AI_NARRATIVE` tetap OFF.
- Legacy Quick 40/Standard 60 tetap backward-compatible.
- Branch `agent/complete-all-lenses-release-ready` hanya menyiapkan kandidat `202607270001`; task ini tidak menulis ke production.

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

Jalur guarded all-lenses production tetap PENDING migration additive `202607270001`. Migration ini belum diterapkan ke hosted database dan tidak mengubah feature flag. Aktivasi hanya boleh dilakukan setelah backup logical diverifikasi dan approval terpisah.

Aktivasi enam lensa baru pada production hanya boleh setelah seluruh kondisi berikut disetujui terpisah:

1. Backup logical schema, data, dan roles dibuat sebelum write serta manifest hash diverifikasi.
2. Dry-run linked hanya menampilkan `202607270001_guarded_all_lenses_release.sql`.
3. Postcheck memastikan 4 version `pilot`, 2 version `experimental`, 147 question/translation tetap `draft`, dan `guardedBeta=true` hanya pada enam version target.
4. Preview atau staging terisolasi digunakan bila tersedia. Jika tidak, risiko single-project harus dicatat eksplisit.
5. Monitoring provider dan rollback owner aktif.
6. `FEATURE_AI_NARRATIVE` tetap OFF. Perubahan flag lain memerlukan approval terpisah.

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

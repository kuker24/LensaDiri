# Modular Release Readiness

Gate aktivasi modular LensaDiri. Migration schema readiness ada di `PRD_V2_MIGRATION_READINESS.md` dan `PRODUCTION_MIGRATION_MAP.md`.

## Posture saat ini

- Base modular schema sampai `202607200001`: applied ke production.
- Quality-model provenance migration `202607200002`: pending production approval, belum diterapkan.
- `feature_flags` production memiliki zero enabled rows. Tidak ada aktivasi modular.
- Legacy Quick 40/Standard 60 tetap baseline produksi.
- Modular seed: not applied.
- Modular feature flags: OFF.

## Release-ready modules

| Module        | Key             | Status      | Selectable |
| ------------- | --------------- | ----------- | ---------- |
| Trait Profile | `trait_profile` | `active`    | ya         |
| 16-Type       | `type_16`       | `published` | ya         |
| Enneagram     | `enneagram`     | `published` | ya         |
| Temperament   | `temperament`   | `published` | ya         |

## Deferred modules

`attachment`, `instinct`, `riasec`, `socionics_communication`, `three_center` berstatus `draft`; `psychosophy` berstatus `experimental`. Semua `is_selectable=false`, dikecualikan dari Full Spectrum, estimate, dan komposisi. Tidak boleh diturunkan dari Big Five.

Setiap modul sudah memiliki scoring engine independen (test-covered), draft item bank Bahasa Indonesia yang telah melewati audit bahasa awal non-klinis, dan draft translation rows. Status tetap deferred sampai review bahasa formal, validasi konstruk, review bias, dan pilot testing (n ≥ 50) selesai. Admin publication gate memblokir modul dengan `review_status = 'draft'` pada question atau translation mana pun.

## Activation gate

Aktivasi modular pada production hanya boleh setelah seluruh kondisi berikut disetujui terpisah:

1. Migration `202607200002` (quality-model provenance) diterapkan ke production melalui approval terpisah. Modular completion path membaca `assessment_blueprints.quality_model_version` untuk memilih faktor confidence versioned, sehingga migration ini wajib mendahului aktivasi flag manapun.
2. Content publication modular dijalankan lewat migration additive, bukan seed. Termasuk `consent_policy_versions` dan `retention_policies` agar privacy dashboard tidak kosong.
3. Preview atau staging database dan secret terisolasi tersedia.
4. Monitoring provider dan rollback owner aktif.
5. Feature flag `FEATURE_MODULAR_COMPOSER` dan `FEATURE_COMPLEX_MODE` di-set dengan compare-and-set dan alasan perubahan.
6. Pilot internal sebelum public enable.

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

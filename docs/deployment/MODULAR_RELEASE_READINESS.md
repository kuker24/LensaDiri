# Modular Release Readiness

Gate aktivasi modular LensaDiri. Migration schema readiness ada di `PRD_V2_MIGRATION_READINESS.md` dan `PRODUCTION_MIGRATION_MAP.md`.

## Posture saat ini

- Schema modular sudah diterapkan ke production (migration additive, immutable).
- `feature_flags` production memiliki zero enabled rows. Tidak ada aktivasi modular.
- Legacy Quick 40/Standard 60 tetap baseline produksi.
- Modular seed tidak dijalankan pada production.

## Release-ready modules

| Module        | Key             | Status      | Selectable |
| ------------- | --------------- | ----------- | ---------- |
| Trait Profile | `trait_profile` | `active`    | ya         |
| 16-Type       | `type_16`       | `published` | ya         |
| Enneagram     | `enneagram`     | `published` | ya         |
| Temperament   | `temperament`   | `published` | ya         |

## Deferred modules

`attachment`, `instinct`, `riasec`, `socionics_communication`, `three_center` berstatus `draft`; `psychosophy` berstatus `experimental`. Semua `is_selectable=false`, dikecualikan dari Full Spectrum, estimate, dan komposisi. Tidak boleh diturunkan dari Big Five.

## Activation gate

Aktivasi modular pada production hanya boleh setelah seluruh kondisi berikut disetujui terpisah:

1. Content publication modular dijalankan lewat migration additive, bukan seed. Termasuk `consent_policy_versions` dan `retention_policies` agar privacy dashboard tidak kosong.
2. Preview atau staging database dan secret terisolasi tersedia.
3. Monitoring provider dan rollback owner aktif.
4. Feature flag `FEATURE_MODULAR_COMPOSER` dan `FEATURE_COMPLEX_MODE` di-set dengan compare-and-set dan alasan perubahan.
5. Pilot internal sebelum public enable.

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

# Backup and Restore Runbook

Prosedur backup dan restore LensaDiri. Restore drill hanya memakai database non-production terisolasi.

## Backup policy

- Gunakan backup terjadwal provider untuk production.
- Simpan migration, checksum, dan seed canonical di Git.
- Jangan menganggap backup valid sebelum restore drill berhasil.
- Provider physical backup atau PITR saat ini `BLOCKED_EXTERNAL` karena keterbatasan platform. Status ini tidak boleh dipalsukan sebagai tersedia.

## Logical backup sebelum migration production

Backup logical schema, data, dan roles dibuat di luar repo dengan permission terbatas sebelum migration production, dan manifest SHA-256 diverifikasi. Prosedur ini tidak menyalin secret ke repo dan tidak mencetak credential.

## Restore drill (disposable only)

Restore hanya ke project non-production terisolasi.

```bash
npm ci
npm run db:start
npm run db:reset
npm run test:seed-replay
npm run test:seed-replay-drift
npm run test:integration
npm run test:db
```

Setelah snapshot hosted direstore ke staging, jalankan post-migration query dari `docs/deployment/PRD_V2_MIGRATION_READINESS.md`, lalu browser smoke tanpa production secrets.

## Status

Hosted backup inspection dan restore drill saat ini `BLOCKED_EXTERNAL` karena staging project terisolasi belum tersedia. Jangan membuka production backup data. Jangan menjalankan reset, integration, pgTAP, seed, atau E2E terhadap production.

## Verifikasi integritas

- Bandingkan canonical seed SHA-256 setelah restore terhadap nilai pada `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md`.
- Konfirmasi migration version lokal dan restore cocok penuh.
- Konfirmasi forced RLS dan zero browser grant tetap berlaku via `npm run test:db`.

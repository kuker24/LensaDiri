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

- **Isolated staging restore drill:** DONE 2026-07-23 on single-use hosted staging (synthetic seed only; project deleted after). Evidence: `docs/operations/OPERATIONS_RUNBOOK.md` + `.pi/EVIDENCE.md`. Proven: migration parity, canonical seed hash, flags OFF, RLS forced, immutability guard, scratch-schema backup→truncate→restore.
- **Provider physical backup / PITR inspection:** still `BLOCKED_EXTERNAL` (platform/plan limits). Direct hosted `pg_dump`/`pg_restore` also `BLOCKED_EXTERNAL` without local Docker/pg client in the operator environment that ran the drill.
- **Long-lived staging:** not kept warm; re-provision when the next drill is required.
- Never open production backup data in chat or repo. Never run reset, integration, pgTAP, seed, or E2E against production.

## Verifikasi integritas

- Bandingkan canonical seed SHA-256 setelah restore terhadap nilai pada `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md`.
- Konfirmasi migration version lokal dan restore cocok penuh.
- Konfirmasi forced RLS dan zero browser grant tetap berlaku via `npm run test:db`.

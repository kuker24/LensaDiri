# Incident Response

Prosedur respons insiden LensaDiri. Topologi environment ada di `ENVIRONMENT_TOPOLOGY.md`. Backup dan restore ada di `BACKUP_RESTORE_RUNBOOK.md`.

## Severity

- SEV-1: kebocoran data, auth bypass, data corruption luas, atau production unavailable total.
- SEV-2: completion, dashboard, atau result access gagal signifikan tanpa kebocoran.
- SEV-3: route non-kritis, copy, atau degradasi terbatas.

## Response sequence

1. Tetapkan incident commander dan timestamp UTC.
2. Bekukan deploy dan publication workflow.
3. Catat deployment SHA, migration terakhir, feature flag state, error sample ter-redaksi, dan scope akun terdampak.
4. Untuk feature regression, set flag kembali OFF memakai compare-and-set.
5. Untuk migration issue, hentikan writer terkait dan pilih forward-fix additive. Jangan menjalankan destructive rollback spontan.
6. Untuk dugaan exposure, cabut secret, revoke session relevan, pertahankan audit evidence, lalu disclosure sesuai kebijakan.
7. Verifikasi health, start, answer, completion, result, share, dan deletion setelah mitigasi.
8. Buat post-incident review dengan root cause, detection gap, corrective action, owner, dan due date.

## Alert threshold

- 5xx lebih dari 2% selama 5 menit.
- Completion failure lebih dari 1% selama 10 menit.
- Database connection failure tiga kali berturut-turut.
- p95 answer save di atas 1.5 detik selama 10 menit.
- Perubahan production feature flag tak terduga.
- Backup job gagal atau restore verification melewati jadwal.

## Data exposure playbook

1. Identifikasi tabel dan scope akun terdampak dari audit log (append-only, immutable).
2. Konfirmasi tidak ada raw answer, password, token mentah, atau IP mentah yang bocor. Kolom sensitif hanya disimpan sebagai HMAC atau Argon2id.
3. Revoke session terdampak lewat `account_sessions`.
4. Rotasi secret yang relevan pada Vercel dan Supabase.
5. Dokumentasikan kronologi dan lakukan disclosure sesuai kebijakan.

## Rollback posture

Production memakai migration-only fix-forward. Applied migration immutable. Rollback aplikasi menunjuk deployment production sehat sebelumnya sebagai target. Rollback database dilakukan hanya dengan additive fix-forward, bukan destructive down-migration.

# LensaDiri Operations Runbook

## Environment topology

| Environment | Application              | Database                      | Secrets                       | Data policy                                               |
| ----------- | ------------------------ | ----------------------------- | ----------------------------- | --------------------------------------------------------- |
| Local       | Next.js dev server       | Supabase CLI disposable       | `.env.local`, tidak di-commit | Reset dan fixture diperbolehkan                           |
| CI          | GitHub Actions ephemeral | Supabase CLI disposable       | GitHub Actions env            | Reset, seed replay, feature fixture diperbolehkan         |
| Preview     | Vercel Preview           | Preview-scoped database wajib | Preview-only                  | Tidak boleh memakai production secrets                    |
| Production  | Vercel production        | Supabase hosted               | Production-only               | Tidak boleh di-reset atau menjadi target test destructive |

Preview database dan preview-scoped secret belum tersedia. Status: `BLOCKED_EXTERNAL` sampai resource dibuat oleh owner platform.

## Monitoring minimum

Pantau per environment:

- availability `/api/health`, latency p50/p95/p99, dan error rate 4xx/5xx
- database connection failures, pool saturation, slow query, lock wait, dan storage growth
- rate-limit spike per route tanpa menyimpan IP mentah
- assessment start, answer save failure, pause/resume failure, clarifier failure, completion rollback, dan result read failure
- share creation/revoke/expiry dan account deletion failure
- deployment SHA, migration checksum, feature flag state, dan publication event

Alert awal:

- 5xx lebih dari 2% selama 5 menit
- completion failure lebih dari 1% selama 10 menit
- database connection failure tiga kali berturut-turut
- p95 answer save di atas 1.5 detik selama 10 menit
- unexpected production feature flag change
- backup job gagal atau restore verification melewati jadwal

## Incident severity

- SEV-1: kebocoran data, auth bypass, data corruption luas, atau production unavailable total
- SEV-2: completion, dashboard, atau result access gagal signifikan tanpa kebocoran
- SEV-3: route non-kritis, copy, atau degradasi terbatas

## Response

1. Tetapkan incident commander dan timestamp UTC.
2. Bekukan deploy serta publication workflow.
3. Catat deployment SHA, migration terakhir, flag state, error sample ter-redaksi, dan scope akun terdampak.
4. Untuk feature regression, set flag kembali OFF memakai compare-and-set.
5. Untuk migration issue, hentikan writer terkait dan pilih forward-fix additive. Jangan menjalankan destructive rollback spontan.
6. Untuk dugaan exposure, cabut secret, revoke session yang relevan, pertahankan audit evidence, lalu lakukan disclosure sesuai kebijakan.
7. Verifikasi health, start, answer, completion, result, share, dan deletion setelah mitigasi.
8. Buat post-incident review dengan root cause, detection gap, corrective action, owner, dan due date.

## Backup dan restore

### Backup policy

- Gunakan backup terjadwal provider untuk production.
- Simpan migration, checksum, dan seed canonical di Git.
- Jangan menganggap backup valid sebelum restore drill berhasil.

### Restore drill

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

Setelah snapshot hosted direstore ke staging, jalankan post-migration queries dari `docs/deployment/PRD_V2_MIGRATION_READINESS.md`, lalu browser smoke tanpa production secrets.

Hosted backup inspection dan restore drill saat ini `BLOCKED_EXTERNAL` karena staging project belum tersedia. Ini tidak boleh dipalsukan sebagai PASS.

## Retention cleanup

Jalankan dari trusted scheduled job, bukan browser:

```sql
select * from public.cleanup_expired_retention_data(now());
```

Function hanya membersihkan guest session kedaluwarsa dan rate-limit bucket lama. Result akun tetap user-controlled. Audit security event mengikuti policy terpisah dan belum dihapus oleh function ini.

## Release checklist

- CI seluruh job PASS pada SHA yang akan dirilis
- working tree dan branch sinkron
- migration checksum direview
- feature flags production tetap OFF sebelum approval
- monitoring dan rollback owner aktif
- preview menggunakan secret terpisah
- PR tetap open sampai keputusan merge manusia

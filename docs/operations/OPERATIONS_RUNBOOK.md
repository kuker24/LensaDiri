# LensaDiri Operations Runbook

## Environment topology

| Environment | Application              | Database                      | Secrets                       | Data policy                                               |
| ----------- | ------------------------ | ----------------------------- | ----------------------------- | --------------------------------------------------------- |
| Local       | Next.js dev server       | Supabase CLI disposable       | `.env.local`, tidak di-commit | Reset dan fixture diperbolehkan                           |
| CI          | GitHub Actions ephemeral | Supabase CLI disposable       | GitHub Actions env            | Reset, seed replay, feature fixture diperbolehkan         |
| Preview     | Vercel Preview           | Preview-scoped database wajib | Preview-only                  | Tidak boleh memakai production secrets                    |
| Production  | Vercel production        | Supabase hosted               | Production-only               | Tidak boleh di-reset atau menjadi target test destructive |

Preview database dan preview-scoped secret wajib diverifikasi sebelum Preview fungsional. Jika belum tersedia, status tetap `BLOCKED_EXTERNAL`; jangan menggantinya dengan production database atau production secret.

## Monitoring minimum

### Implementasi repository

- `src/server/observability.ts` menulis satu JSON object per event ke runtime log. Schema hanya mengizinkan operation, status, durasi, correlation ID acak, error code terkontrol, environment, deployment SHA, dan timestamp. Raw answer, token, email, account ID, IP, user-agent, request body, serta private result tidak diterima oleh API logger.
- Assessment start, answer save, completion, estimate, register boundary, dan session DB phases memakai event tersebut. Filter awal: `type=operational_event`, lalu `operation`, `status`, atau `correlation_id`. Auth phase telemetry lama tetap safe tetapi belum seluruhnya bermigrasi ke schema JSON; jangan memakai query JSON sebagai satu-satunya sumber metrik auth.
- `.github/workflows/production-liveness.yml` meminta schedule `GET /api/health` setiap lima menit dari GitHub-hosted runner. GitHub schedule bersifat best-effort dan dapat terlambat atau terlewat saat load tinggi; ini bukan jaminan detection time lima menit. Failure membuka satu issue bertanda internal `[alert] Production liveness monitor failed`; failure berikutnya menambah komentar; recovery menutup issue bertanda sama.
- `workflow_dispatch` dengan `drill=true` sengaja menggagalkan check untuk membuktikan jalur issue alert. Workflow baru tersedia untuk schedule/manual dispatch setelah file masuk default branch.
- Vercel Hobby runtime log retention hanya satu jam menurut dokumentasi provider saat implementasi. Runtime log bukan audit log atau penyimpanan evidence jangka panjang.

Status task branch: implementation dan local checks siap; schedule belum aktif, alert delivery drill belum PASS, Vercel error-anomaly destination belum dikonfigurasi. Jangan klaim monitoring production lengkap sebelum PR merged, satu scheduled run PASS, drill membuka issue, recovery menutup issue, dan owner mengonfirmasi destination.

### Operator checks

```bash
npm run monitor:health
gh workflow run production-liveness.yml -f drill=true
gh run watch
```

Drill hanya setelah workflow ada di default branch. Expected evidence: failed workflow URL, deduplicated alert issue URL, subsequent healthy run, issue auto-closed, owner, timestamp UTC. Jangan memasukkan payload pengguna atau credential ke issue.

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

Scheduled liveness saat ini hanya membuktikan availability dan alert routing. Threshold 5xx, operation failure ratio, p95, database saturation, feature-flag drift, serta backup/restore memerlukan Vercel/Supabase alert configuration dan explicit operator approval. Gunakan default Vercel error-anomaly alert sebagai lapisan tambahan; jangan menganggapnya setara threshold deterministik di atas.

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
- PR tetap open sampai Preview, hosted migration postcheck, dan keputusan merge lulus
- Vercel dan CI memakai Node.js 22.x
- production seed dan seluruh feature flag modular tetap OFF untuk release aman
- deployment production sehat sebelumnya tercatat sebagai target rollback aplikasi

## Observability rollback

Tidak ada migration atau data rollback untuk fondasi ini.

1. Jika monitor salah positif, nonaktifkan `.github/workflows/production-liveness.yml` atau revert commit workflow; tutup issue setelah penyebab tercatat.
2. Jika structured logging menyebabkan regresi aplikasi, promote deployment sehat sebelumnya atau revert PR. Event logging tidak boleh mengubah response atau transaction outcome.
3. Jangan menghapus audit log, application data, atau production table untuk rollback observability.

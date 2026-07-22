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

Status 2026-07-22: PR #25 merged pada `b424395`; merged-SHA CI dan Vercel deployment PASS. Manual healthy run PASS. Drill membuka tepat satu marked issue #26; recovery menutupnya otomatis. First provider-scheduled run `29920936659` PASS. Vercel error-anomaly destination belum dikonfigurasi. Jangan klaim provider-threshold PASS sebelum bukti configuration tersedia.

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

### Staging + restore drill 2026-07-23

Drill terisolasi dijalankan pada hosted staging sekali-pakai (`lensadiri-staging`, ap-southeast-1), seed sintetis, tanpa data production, lalu project dihapus. Production tidak disentuh.

- Migration parity: 15 migration (`202607120001`..`202607280001`) di-push ke staging kosong; `migration list --linked` menunjukkan Local==Remote seluruhnya; dry-run ulang melaporkan "Remote database is up to date".
- Seed canonical: tujuh seed diterapkan; snapshot canonical `sha256=45275f2a39fc284e8cb716c4b7c84b332fbcc3d150ce0fa83a0b040ec6739212` cocok identitas reviewed; counts modules 10, module_versions 11, dimensions 49, questions/translations/mappings 405, presets 6, combo_mappings 27; zero duplikat; zero flag enabled.
- Seed idempotence: replay kedua menghasilkan hash canonical yang sama persis.
- RLS: `consent_policy_versions`, `retention_policies`, `content_publication_events`, `account_recovery_tokens` semuanya `relrowsecurity=true` dan `relforcerowsecurity=true`; grant `anon`/`authenticated`/`PUBLIC` nol.
- Immutability: DELETE terhadap `question_translations` ditolak trigger "published module content is immutable"; content tetap utuh (hash tidak berubah).
- Backup/restore mechanics: pada scratch schema `drill` (copy faithful 405 baris), backup 405 baris (`sha256=41822e8c...`) → truncate ke 0 → restore transaksional → hash dan jumlah baris identik (`RESTORE_VERIFIED`); scratch schema di-drop.
- Integration, pgTAP, Playwright, dan accessibility tetap dibuktikan CI-disposable pada merged-SHA `468f098` run `29952443369` (`Database and browser tests` PASS); Docker lokal unavailable sehingga suite destructive tidak dijalankan terhadap hosted.

Rollback drill: project staging bersifat sekali-pakai dan sudah dihapus (`supabase projects delete`); tidak ada perubahan pada production database, secret, atau migration. CLI local link tidak lagi menunjuk project mana pun setelah penghapusan.

Hosted backup inspection langsung (pg_dump/pg_restore) tetap `BLOCKED_EXTERNAL` di environment ini karena tidak ada Docker/pg client lokal; provider scheduled backup dan restore-ke-staging berulang memerlukan re-provisioning staging saat dibutuhkan.

## Retention cleanup

### Scheduler

- Daily Vercel Cron memanggil `GET /api/cron/retention-cleanup` (`vercel.json`, `0 3 * * *` UTC). Vercel Hobby membatasi cron sekali per hari dan dapat menembak kapan pun dalam jam terjadwal; delivery best-effort tanpa retry.
- Route memerlukan header `Authorization: Bearer <CRON_SECRET>` (constant-time compare, fail-closed). Tanpa `CRON_SECRET` terkonfigurasi atau token salah, route mengembalikan 401 dan tidak melakukan apa pun. `CRON_SECRET` diset di Vercel sebagai environment variable, minimal 16 karakter, berbeda dari secret lain, tidak pernah dicetak.
- Cleanup memanggil `cleanup_expired_retention_data(now())` yang idempotent: hanya menghapus guest session kedaluwarsa dan rate-limit bucket lebih tua dari 90 hari. Result akun tetap user-controlled dan tidak pernah disentuh. Duplicate atau missed run aman karena delete-where-eligible.
- Setiap invocation menulis satu `operational_event` (`operation=retention_cleanup`, `retention_counts` aggregate non-PII).

### Dry run

Verifikasi eligibility tanpa menghapus data:

```bash
CRON_SECRET=<secret> npm run monitor:retention -- --url https://lensadiri.vercel.app
```

Ini memanggil `GET /api/cron/retention-cleanup?dryRun=1`, yang menjalankan `preview_expired_retention_data(now())` read-only dan mengembalikan jumlah baris yang akan dihapus. Fungsi preview additive, security-definer, dan direvoke dari browser roles.

Trusted manual SQL (server/editor tepercaya, bukan browser):

```sql
select * from public.preview_expired_retention_data(now()); -- read-only
select * from public.cleanup_expired_retention_data(now());  -- deletes eligible only
```

Audit security event mengikuti policy 365 hari terpisah dan belum dihapus oleh function ini; rekonsiliasi audit retention adalah task terpisah.

### Failure alerting

`.github/workflows/retention-monitor.yml` menjalankan dry-run terjadwal memakai GitHub secret `CRON_SECRET`. Kegagalan membuka satu issue bertanda `[alert] Retention cleanup monitor failed`; recovery menutupnya. `workflow_dispatch` dengan `drill=true` sengaja gagal untuk memverifikasi alert routing. Workflow/cron baru aktif setelah file masuk default branch; jangan klaim scheduled PASS sebelum ada run URL.

Status 2026-07-22: PR #28 merged sebagai `e5a37d1`; merged-SHA CI `29928134247` PASS. Migration `202607280001` applied dan `CRON_SECRET` tersedia pada Vercel Production serta GitHub Actions. Dry-run `29928883702` menghitung 2 guest session eligible dan 0 rate-limit; cleanup menghapus tepat jumlah tersebut; post-cleanup dry-run `29929102188` menghasilkan nol. Drill `29929143971` membuka tepat satu issue #29; recovery `29929191879` menutupnya otomatis. First provider-scheduled Vercel cron masih `PENDING_PROVIDER` sampai ada invocation evidence setelah jadwal 03:00 UTC.

### Rollback

Tidak ada data rollback. Migration `202607280001` additive dan hanya menambah fungsi read-only.

1. Untuk menghentikan cleanup terjadwal: hapus blok `crons` dari `vercel.json` dan redeploy, atau Disable Cron Jobs di Vercel; atau revert PR.
2. Untuk false alert retention monitor: nonaktifkan/revert `.github/workflows/retention-monitor.yml`, tutup issue setelah penyebab tercatat.
3. Jangan menghapus fungsi cleanup, audit log, atau data untuk rollback. Gunakan fix-forward.

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

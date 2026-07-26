# LensaDiri Operations Runbook

## Maintenance mode (from `v0.9.0-hobby-modular`)

Engineering hobby modular is **closed**. Default work:

- security patches, dependency updates, monitoring/health, retention cron observation
- regression tests, backup/restore readiness (disposable only)
- residual issues **#40–#45** (operator / human / product / external)

Rules: **small PR**, **CI green**, **rollback documented**, no clinical/WCAG claims, no production DB reset.

Out of scope without explicit product re-open: new modules, major UI, AI narrative ON, Full Spectrum publish, fake formal review.

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
- Cleanup memanggil `cleanup_expired_retention_data(now())` yang idempotent: menghapus guest session kedaluwarsa, rate-limit bucket lebih tua dari 90 hari, dan audit security event lebih tua dari 365 hari (policy `audit_security_event`). Result akun tetap user-controlled dan tidak pernah disentuh. Duplicate atau missed run aman karena delete-where-eligible.
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

Audit security event (`audit_logs` lebih tua dari 365 hari) dihitung sebagai resource `audit_security_events` pada preview/cleanup yang sama. Append-only trigger tetap menolak DELETE langsung; hanya path retention (GUC `lensadiri.retention_cleanup`) dan hard-delete akun yang diizinkan.

### Failure alerting

`.github/workflows/retention-monitor.yml` menjalankan dry-run terjadwal memakai GitHub secret `CRON_SECRET`. Kegagalan membuka satu issue bertanda `[alert] Retention cleanup monitor failed`; recovery menutupnya. `workflow_dispatch` dengan `drill=true` sengaja gagal untuk memverifikasi alert routing. Workflow/cron baru aktif setelah file masuk default branch; jangan klaim scheduled PASS sebelum ada run URL.

Status 2026-07-22: PR #28 merged sebagai `e5a37d1`; merged-SHA CI `29928134247` PASS. Migration `202607280001` applied dan `CRON_SECRET` tersedia pada Vercel Production serta GitHub Actions. Dry-run `29928883702` menghitung 2 guest session eligible dan 0 rate-limit; cleanup menghapus tepat jumlah tersebut; post-cleanup dry-run `29929102188` menghasilkan nol. Drill `29929143971` membuka tepat satu issue #29; recovery `29929191879` menutupnya otomatis. First provider-scheduled Vercel cron masih `PENDING_PROVIDER` sampai ada invocation evidence setelah jadwal 03:00 UTC.

### Rollback

Tidak ada data rollback. Migration `202607280001` additive dan hanya menambah fungsi read-only.

1. Untuk menghentikan cleanup terjadwal: hapus blok `crons` dari `vercel.json` dan redeploy, atau Disable Cron Jobs di Vercel; atau revert PR.
2. Untuk false alert retention monitor: nonaktifkan/revert `.github/workflows/retention-monitor.yml`, tutup issue setelah penyebab tercatat.
3. Jangan menghapus fungsi cleanup, audit log, atau data untuk rollback. Gunakan fix-forward.

## Account recovery email

Free-tier activation checklist (no paid plan required): `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`. Residual index: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`.

### Status

Recovery token foundation is live in schema and APIs. Delivery uses Resend when `RESEND_API_KEY` and `EMAIL_FROM` are both set; otherwise transport stays disabled and no token is issued. `FEATURE_REQUIRE_EMAIL_VERIFICATION` defaults off so existing accounts keep logging in without email verification.

Security properties (already enforced server-side):

- Token raw value only in the email body/link fragment (`#token=`); database stores HMAC hash only
- 30-minute expiry, single-use consume, one active delivered token per account+purpose
- Anti-enumeration: forgot/request-verification always `202 request_accepted`
- Rate limits on forgot, reset, verify, and request-verification routes
- Password reset revokes all sessions for the account
- Mandatory verification (when flag on) blocks login for `email_verified_at IS NULL` with `email_unverified`; does not change password or session tables

### Activation order (requires explicit approval per step)

1. Verify Resend domain/sender for the target environment (Preview/staging first).
2. Set Preview `EMAIL_FROM` + `RESEND_API_KEY` only. Confirm forgot-password and verify-email deliver to a disposable inbox; confirm token works once then fails on replay.
3. Optional: enable auto-send on register (already best-effort when transport enabled).
4. Production delivery: set Production `EMAIL_FROM` + `RESEND_API_KEY` only after Preview evidence. Leave `FEATURE_REQUIRE_EMAIL_VERIFICATION` unset/`0`.
5. Mandatory verification: set `FEATURE_REQUIRE_EMAIL_VERIFICATION=1` only after product approval and a communication plan for legacy accounts (`email_verified_at` null). No migration backfill required; nullable column is the grandfather path until users verify.
6. Monitor Vercel logs for `operation=recovery_email_send` success/failure counts (no email/token fields).

### Staging drill checklist

```bash
# Preview or disposable staging only — never production secrets
# 1) Register disposable account
# 2) Request verification / forgot password
# 3) Open link from inbox (fragment token)
# 4) Confirm single-use + session revoke after reset
# 5) Confirm unknown email still returns accepted UI without delivery
```

CI already exercises the same lifecycle with `RECOVERY_TEST_TRANSPORT=1` (integration + Playwright). Real-provider drill is operator-owned and environment-scoped.

### Rollback

1. Delivery off: remove `RESEND_API_KEY` and/or `EMAIL_FROM` from the environment and redeploy. APIs remain safe; transport returns dormant.
2. Mandatory verification off: set `FEATURE_REQUIRE_EMAIL_VERIFICATION=0` or remove it and redeploy. Login works for unverified accounts again.
3. No schema rollback. Do not delete `account_recovery_tokens` or `email_verified_at`.
4. Compromised API key: rotate Resend key, update env, redeploy; existing unused tokens expire within 30 minutes.

## Release checklist

### Engineering ship gate (hobby modular — tag `v0.9.0-hobby-modular` @ `bdeeec5`)

- [x] CI seluruh job PASS pada SHA yang dirilis
- [x] working tree / `main` sinkron dengan production deploy
- [x] migration Local==Remote through `202607290001` (linked list)
- [x] production flags match approved posture: composer ON; Complex ON; provisional precision ON; AI OFF
- [x] health `200`; modules 10; deep selectable; combos 5 (deep pilot; full_spectrum hidden)
- [x] monitoring + rollback owner (`docs/deployment/RELEASE_ROLLBACK.md`)
- [x] production seed **not** re-run on hosted
- [x] residual gates tracked as issues #40–#45 — **not** claimed done
- [x] changelog + tag + handoff final recorded
- [ ] Preview secrets never equal production Resend/DB (when Resend enabled)
- [ ] Vercel/CI Node.js 22.x confirmed on next deploy window

### Residual gates (not required for hobby engineering release-ready)

| Gate                                          | Issue | Class             |
| --------------------------------------------- | ----- | ----------------- |
| Resend Preview→prod→optional mandatory verify | #40   | operator external |
| Formal review 6 guarded modules               | #41   | human             |
| Full Spectrum redesign/decision               | #42   | product           |
| Psychometric program                          | #43   | external          |
| Manual a11y / WCAG cert                       | #44   | external/human    |
| AI narrative                                  | #45   | deferred          |

Do **not** mark PRD 100% or scientific/WCAG certified until residual evidence lands. See `docs/deployment/RELEASE_CLOSURE_GATES.md`.

## Observability rollback

Tidak ada migration atau data rollback untuk fondasi ini.

1. Jika monitor salah positif, nonaktifkan `.github/workflows/production-liveness.yml` atau revert commit workflow; tutup issue setelah penyebab tercatat.
2. Jika structured logging menyebabkan regresi aplikasi, promote deployment sehat sebelumnya atau revert PR. Event logging tidak boleh mengubah response atau transaction outcome.
3. Jangan menghapus audit log, application data, atau production table untuk rollback observability.

# Project Handoff

## Current Objective

Menjaga hobby production baseline LensaDiri di Vercel + Supabase tetap sehat, terdokumentasi, dan aman untuk iterasi berikutnya.

## Project State

**IN_PROGRESS.** Core MVP lokal dan hobby production baseline tersedia. Production aktif di `https://lensadiri.vercel.app` dengan Supabase hosted Singapore project. Working tree masih berisi perubahan besar yang belum di-commit. Branch aktif `agent/phase-1-foundation` tercatat ahead 3 dari remote saat checkpoint. Local Next.js dapat dihentikan; local Supabase mungkin aktif setelah verification dan boleh dihentikan bila tidak dipakai.

## Completed

- Membuat auth UI dan API register, login, logout, session bootstrap, serta dashboard private.
- Menambah session HttpOnly, same-origin CSRF, Argon2id, strict Zod boundaries, dan rate limit.
- Menambah hard-delete akun permanen dengan verifikasi password dan frasa `HAPUS AKUN`; session, consent, assessment, result, share, feedback, dan audit terkait ikut dihapus.
- Menambah liveness-only `GET /api/health`.
- Menambah Quick assessment 40 item dan Standard assessment 60 item original Bahasa Indonesia.
- Menambah consent, autosave/upsert idempotent, resume, atomic completion, dan private result.
- Menambah deterministic server-side trait scoring serta overlay Jungian-inspired 16-Type, Enneagram-inspired core/wing, dan temperament dengan disclaimer.
- Menambah account result summary, result feedback, safe share/revoke, safe JSON export, dan permanent result deletion.
- Menambah forced-RLS/default-deny schema, seed, pgTAP, PostgreSQL integration tests, dan Playwright desktop/Pixel 5 flows.
- Memperbarui DOX root dan child agar mencerminkan baseline MVP lokal.
- Menulis evidence MVP lokal di `docs/qa/MVP_LOCAL_VERIFICATION.md`.
- Membuat Supabase hosted production project di Singapore, push 5 additive migrations + idempotent 60-item seed tanpa reset, dan memverifikasi 60/40 question counts serta zero browser policies.
- Membuat Vercel project `lensadiri`, memasang enam production environment variables sebagai Sensitive, dan deploy alias `https://lensadiri.vercel.app`.
- Memperbaiki kompatibilitas Supabase transaction pooler (`prepare:false`, production pool max 1), clean-build TypeScript issues, dan hosted PostgreSQL email regex melalui additive migration.
- Menjalankan production public smoke serta disposable register/login/dashboard/permanent-delete lifecycle; akun smoke berhasil dihapus dan login ulang ditolak.

## Changed Files

- `AGENTS.md`, `src/AGENTS.md`, `tests/AGENTS.md`, `supabase/AGENTS.md`, `docs/AGENTS.md`: peta dan kontrak MVP lokal.
- `docs/qa/MVP_LOCAL_VERIFICATION.md`: evidence local MVP dan remaining risks.
- `docs/qa/PHASE_1_VERIFICATION.md`, `docs/security/PHASE_1_AUTH.md`: menandai checkpoint Phase 1 sebagai historis.
- `src/app/api/auth/**`, `src/app/login/**`, `src/app/register/**`: auth HTTP dan UI.
- `src/app/api/account/delete/route.ts`, `src/app/dashboard/**`: account privacy dan permanent deletion.
- `src/app/api/health/route.ts`: liveness endpoint.
- `src/app/api/assessment/**`, `src/app/start/**`, `src/app/test/[token]/**`: assessment start, consent, answer, resume, completion, dan runner.
- `src/app/api/result/**`, `src/app/api/shared/**`, `src/app/result/**`, `src/app/shared/**`: private/shared result, feedback, export, share/revoke, dan delete.
- `src/components/{auth-form,logout-button,delete-account-form,start-assessment-form,test-runner,result-*}.tsx`: interactive auth, assessment, dan result UI.
- `src/lib/auth/client.ts`, `src/lib/assessment/client.ts`: browser API helpers tanpa persistence token tambahan.
- `src/lib/scoring/profile.ts`, `src/lib/validation/{auth,assessment}.ts`, `src/lib/security/rate-limit.ts`: scoring, strict validation, dan route policies.
- `src/server/current-session.ts`, `src/server/repositories/{accounts,assessment}.ts`, `src/server/services/{auth,rate-limiter}.ts`: trusted session, persistence, completion, account erasure, dan throttling.
- `supabase/migrations/202607130001_account_hard_delete.sql`: atomic account erasure.
- `supabase/migrations/202607130002_mvp_assessment.sql`: assessment, answer, result, score, dan share schema.
- `supabase/migrations/202607130003_mvp_feedback.sql`: result feedback schema.
- `supabase/seed/20260713_mvp_item_bank.sql`, `supabase/config.toml`: 60-item seed dan local reset wiring.
- `supabase/tests/{phase_1_rls,mvp_assessment_rls}.test.sql`: 139 pgTAP assertions total.
- `tests/unit/profile.test.ts`, `tests/unit/request-validation.test.ts`: scoring/overlay dan boundary regressions.
- `tests/integration/{phase-1-foundation,mvp-assessment}.test.ts`: auth hard-delete dan Quick/Standard DB lifecycle.
- `tests/e2e/{auth,assessment}.spec.ts`, `playwright.config.ts`: desktop/Pixel 5 browser flows.
- `supabase/.branches/_current_branch`, `supabase/.temp/cli-latest`: untracked Supabase CLI runtime metadata; review before any commit.

## Verification

Latest source checkpoint, after final scoring and Standard-flow changes:

| Command                                                             | Result                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `npm run format:check`                                              | PASS                                                                |
| `npm run lint`                                                      | PASS                                                                |
| `npm run typecheck`                                                 | PASS                                                                |
| `npm test`                                                          | PASS                                                                |
| `npm run build`                                                     | PASS                                                                |
| `npm audit --audit-level=high`                                      | PASS                                                                |
| `npm run db:reset`                                                  | PASS against local Docker-backed Supabase                           |
| `TEST_DATABASE_URL=<local-disposable-url> npm run test:integration` | PASS                                                                |
| `npm run test:db`                                                   | PASS; pgTAP plans 92 + 47                                           |
| `npm run test:e2e`                                                  | PASS on Desktop Chromium and Pixel 5 projects                       |
| `git diff --check`                                                  | PASS                                                                |
| Local preview smoke                                                 | PASS: landing HTTP 200 and `/api/health` returned `{"status":"ok"}` |
| Runtime shutdown check                                              | PASS: Next.js STOPPED and Supabase STOPPED                          |

Checkpoint-only AGENTS/HANDOFF Markdown changes require final Prettier and diff checks before handoff is closed.

## Current Blockers

No blocker for hobby production baseline. Production alias, hosted DB migration/seed, health, public routes, security headers, dan disposable account lifecycle sudah lulus. Formal production readiness masih terbatas oleh ketiadaan staging terpisah, monitoring integration, backup/restore drill, custom domain verification, dan full remote assessment E2E.

Additional unresolved scope:

- Item bank/scoring lack formal psychometric validation, norming, and domain-expert review.
- Item text is Indonesian-only.
- Admin item-bank UI, email verification, and password reset are not implemented.
- Formal automated WCAG audit is not implemented; current evidence is semantic, keyboard, desktop, and Pixel 5 smoke coverage.
- Working tree is large and uncommitted. Do not discard unrelated or existing changes.
- `.pi/EVIDENCE.md` still describes historical Phase 1 Docker-blocked state; use `docs/qa/MVP_LOCAL_VERIFICATION.md` and this handoff as current evidence until that file is refreshed.

## Next Steps

1. Review `git status` and `git diff`; separate Supabase CLI runtime metadata from source before any requested commit.
2. Refresh `.pi/EVIDENCE.md` if ongoing engineering evidence should become current MVP evidence.
3. Untuk perubahan DB berikutnya, buat backup sesuai kemampuan Supabase plan, dry-run, lalu additive migration-only; jangan reset hosted production.
4. Tambah email verification/password reset dan admin item-bank workflow hanya sebagai follow-up terpisah.
5. Tambah monitoring, backup/restore drill, custom domain, formal accessibility, dan psychometric/domain review sebelum klaim production matang.

## Resume Instructions

1. Work from repository root `LensaDiri/`, not its parent directory.
2. Read root `AGENTS.md`, nearest child `AGENTS.md`, this handoff, and `docs/qa/MVP_LOCAL_VERIFICATION.md`.
3. Run `git status --short --branch`; preserve all current modified and untracked source.
4. For DB work, start local Supabase with `sg docker -c 'npm run db:start'` if current shell has not inherited Docker group membership.
5. After DB changes run clean reset, disposable integration tests, pgTAP, then desktop/Pixel 5 E2E.
6. Do not read `.env*`, print credentials, commit, push, deploy, or remove user changes without explicit instruction.

## User Notes

- User chose full MVP local before production work.
- Account deletion must be permanent, require current password, and delete all related audit records.
- Health endpoint must remain liveness-only and not reveal DB/internal details.
- Guest result access remains token-gated.
- UI gate uses Pixel 5 plus keyboard/accessibility smoke; formal axe/WCAG audit deferred.
- User requested short Docker instructions when needed.
- User previewed local web successfully, then requested all local runtime stopped.
- User memilih single hobby production project tanpa staging terpisah dan menyetujui migration-only workflow.
- Production aktif di `https://lensadiri.vercel.app`; Supabase region Singapore.
- Credential production disimpan lokal di luar repository dan tidak boleh dicetak atau dipindahkan ke chat.
- No commit or push requested.

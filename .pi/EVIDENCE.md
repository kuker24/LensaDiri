# Engineering Evidence

> Refreshed 2026-07-26 after `main` `3eb53bc` (#36). Supersedes retention-era checkpoint at `e5a37d1`.

## Objective

Reproducible checkpoint: hobby production baseline + modular guarded composer live; recovery delivery dormant; Complex/precision/AI OFF; residual gates external or approval-bound.

## Source checkpoint

- Production checkpoint: `main` / `origin/main` `3eb53bc feat(admin): DB-backed read-only catalog, feedback, and audit views (#36)`.
- Prior: #35 Resend recovery transport (`c6e5d04`), #34 audit retention 365d (`fd54ff6`), #33/#32 deps, #31 staging restore docs, #30 retention evidence, #28 retention scheduler.
- Production URL: `https://lensadiri.vercel.app`.
- Production identifiers, database URLs, tokens, passwords, keys, and secrets are intentionally excluded.

## Production state

- Migrations through `202607290001` applied (Local==Remote at last linked list).
- `FEATURE_MODULAR_COMPOSER` ON; `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, `FEATURE_AI_NARRATIVE` OFF (flag table not re-queried in every audit; API-derived signals match last postcheck).
- 10 modules selectable; deep/full_spectrum presets hidden (draft).
- Recovery: foundation + Resend code path live; no production secrets; verification flag OFF.
- Admin: DB-backed read-only (#36); guest unauthenticated redirect.

## Post-#36 smoke (read-only)

| Check                | Result                                          |
| -------------------- | ----------------------------------------------- |
| `GET /api/health`    | `200` `{"status":"ok"}`                         |
| `GET /admin` (guest) | `307` fail-closed redirect                      |
| Retention unauth     | `401`                                           |
| Merged-SHA CI #36    | Quality + Database/browser PASS (`30177789771`) |

## Local / CI evidence (candidate era)

Canonical seed SHA-256: `45275f2a39fc284e8cb716c4b7c84b332fbcc3d150ce0fa83a0b040ec6739212`.

| Gate                                    | Result                                                         |
| --------------------------------------- | -------------------------------------------------------------- |
| format / lint / typecheck / build       | PASS on recent PRs                                             |
| unit (admin #36 local)                  | PASS: 157 tests at PR evidence                                 |
| `npm audit --audit-level=high`          | PASS: zero high+                                               |
| seed-replay / drift                     | PASS in CI disposable                                          |
| integration / pgTAP / Playwright / a11y | PASS in CI disposable (Complex flags ON only on disposable DB) |

E2E/a11y modular runs enable `FEATURE_MODULAR_COMPOSER` and `FEATURE_COMPLEX_MODE` on disposable DB only, matching CI. No production flag change.

## Security posture

- Server-only DB, scoring, transport; CSRF + rate limit on cookie mutations.
- Argon2id passwords; session/assessment/result/share/recovery tokens HMAC-hashed at rest.
- Recovery: single-use, expiry, generic response, session revoke, concurrent-safe; transport fail-closed without secrets.
- Forced RLS, zero browser policy, zero direct `anon`/`authenticated` privilege (pgTAP).
- Public share allowlist; private quality/confidence/clarifier/timing stay private.
- Operational logs field-allowlisted; no raw answer, token, email, IP, UA, body, private result.
- Admin DTO: no result_id/token/email; audit metadata allowlist `outcome`/`source`/`reason`; limit 50.

## Retention + observability (prior evidence)

- Retention: migration `202607280001` + cron route + monitor drill; audit roll-off `202607290001` (365d).
- First provider-scheduled retention cron at 03:00 UTC may remain `PENDING_PROVIDER` until observed; manual path verified.
- Health monitor workflow active; alert issue routing proven on drills.

## Isolated staging + restore drill (2026-07-23)

Single-use hosted staging (`lensadiri-staging`), synthetic seed only, project deleted after drill. Production untouched.

| Gate                                     | Result                                         |
| ---------------------------------------- | ---------------------------------------------- |
| Migration parity                         | PASS Local==Remote                             |
| Canonical seed hash                      | PASS pinned SHA                                |
| Seed idempotence / flags OFF             | PASS                                           |
| RLS forced + zero grants                 | PASS                                           |
| Immutability guard                       | PASS                                           |
| Backup → loss → restore (scratch schema) | PASS                                           |
| Direct `pg_dump`/`pg_restore`            | `BLOCKED_EXTERNAL` (no local Docker/pg client) |

Details: `docs/operations/OPERATIONS_RUNBOOK.md`, `docs/operations/BACKUP_RESTORE_RUNBOOK.md`.

## Residual / deferred (do not claim done)

- Resend Preview → prod delivery → mandatory verification (credentials + approval).
- Complex mode, provisional precision, AI narrative flags.
- Formal six-module item review / publish; Deep/Full Spectrum preset publish.
- Psychometric validation; third-party WCAG certification; manual SR audits.
- Direct SQL postcheck for draft counts / guardedBeta / AI flag row (operator only).
- Provider PITR / physical backup inspection; custom domain; isolated long-lived staging.

Operator SQL pack: `docs/deployment/PRODUCTION_POSTCHECK_SQL.md`.
Gate matrix: `docs/deployment/RELEASE_CLOSURE_GATES.md`.

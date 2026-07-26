# Release Closure Gates

Honest matrix: production-live engineering vs residual external / product / human work.

**Checkpoint:** `main` @ `e8186df` (2026-07-26 final audit).
**Production:** `https://lensadiri.vercel.app` · migrations Local==Remote through `202607290001`.

## Release-ready status (do not claim 100%)

| Lens                                        | Status                                                        | Approx. completion            |
| ------------------------------------------- | ------------------------------------------------------------- | ----------------------------- |
| **Hobby modular engineering release-ready** | **YES** — shippable production hobby with Complex + precision | **~90%** engineering scope    |
| **PRD v2.0 full product completion**        | **NO** — residual external + product + human gates open       | **~72%** weighted PRD surface |
| **Scientific / WCAG certification**         | **NO**                                                        | **0%** formal claims          |

Completion is **not** 100% until Resend delivery, formal 6-module review, Full Spectrum product decision (or explicit permanent defer), psychometrics program, manual a11y/WCAG path, and AI narrative decision are closed or explicitly wontfix with evidence.

### Weight model (audit 2026-07-26)

| Bucket                                       | Weight | Done | Notes                                       |
| -------------------------------------------- | ------ | ---- | ------------------------------------------- |
| Legacy + auth + security baseline            | 25     | 100% | Argon2id, CSRF, RLS forced, private results |
| Modular composer + 10 engines + scoring      | 25     | 100% | Server-authoritative; independent modules   |
| Complex + provisional precision + deep pilot | 10     | 100% | Flags ON; deep selectable (#38)             |
| Admin read-only + retention + monitors       | 10     | 100% | #28–#36                                     |
| Recovery email **delivery**                  | 8      | ~30% | Code #35; secrets absent                    |
| Formal review 6 guarded modules              | 8      | 0%   | draft 147+147; #41                          |
| Full Spectrum product path                   | 5      | ~20% | draft only; #42                             |
| Psychometric validation                      | 4      | 0%   | #43                                         |
| Manual a11y / WCAG cert                      | 3      | ~40% | auto PASS; no cert; #44                     |
| AI narrative                                 | 2      | 0%   | flag OFF; #45                               |

Weighted PRD-ish total ≈ **0.25·100 + 0.25·100 + 0.10·100 + 0.10·100 + 0.08·30 + 0.08·0 + 0.05·20 + 0.04·0 + 0.03·40 + 0.02·0 ≈ 72%**.
Engineering-only (first four buckets + code for recovery) ≈ **90%**.

## Live in production

| Area                                   | Evidence                                                 |
| -------------------------------------- | -------------------------------------------------------- |
| Hobby baseline + legacy Quick/Standard | Public app + CI                                          |
| Modular composer                       | `FEATURE_MODULAR_COMPOSER` ON                            |
| Complex mode                           | `FEATURE_COMPLEX_MODE` **ON**; deep selectable via #38   |
| Provisional precision                  | `FEATURE_PROVISIONAL_PRECISION` **ON**                   |
| Guarded 10 modules                     | API + linked DB postcheck                                |
| Deep preset                            | `deep_self_discovery` **pilot** (not formal `published`) |
| Migrations through `202607290001`      | linked list MATCH                                        |
| Retention + audit 365d                 | #28–#34                                                  |
| Admin read-only                        | #36                                                      |
| Recovery foundation                    | #35 code; delivery dormant                               |
| Activation evidence docs               | #39 @ `e8186df`                                          |

## Gate matrix

| Gate                                              | Production              | Owner class           | Tracking | Status               |
| ------------------------------------------------- | ----------------------- | --------------------- | -------- | -------------------- |
| Direct DB postcheck                               | DONE 2026-07-26         | eng                   | —        | **DONE**             |
| Complex mode                                      | ON                      | eng                   | —        | **DONE**             |
| Provisional precision                             | ON                      | eng                   | —        | **DONE**             |
| Deep preset                                       | pilot                   | eng                   | —        | **DONE**             |
| Issue hygiene (epics)                             | #2/#4/#5 closed         | eng                   | —        | **DONE**             |
| Residual issue split                              | #40–#45 open            | eng                   | —        | **DONE** 2026-07-26  |
| Resend Preview → prod → optional mandatory verify | NOT RUN / dormant       | **operator external** | **#40**  | **BLOCKED**          |
| Formal review 6 modules                           | draft items             | **human**             | **#41**  | **BLOCKED_HUMAN**    |
| Full Spectrum                                     | draft                   | **product**           | **#42**  | **BLOCKED_PRODUCT**  |
| Psychometric validation                           | not claimed             | **external**          | **#43**  | **BLOCKED_EXTERNAL** |
| Manual a11y / WCAG cert                           | auto PASS only          | **external/human**    | **#44**  | **BLOCKED_EXTERNAL** |
| AI narrative                                      | OFF                     | **deferred**          | **#45**  | **DEFERRED**         |
| Long-lived staging / PITR / `pg_dump`             | partial                 | external              | ops      | **PARTIAL**          |
| First retention cron observation                  | may be PENDING_PROVIDER | ops                   | runbook  | **WATCH**            |

## Scope partition

### Done (engineering, production)

- Auth, session HttpOnly, CSRF, rate limit, Argon2id, hard-delete + re-auth
- Legacy Quick 40 / Standard 60 + modular composer (10 modules, independent scoring)
- Complex mode + provisional precision ON; deep mode UI/API selectable
- `deep_self_discovery` pilot; five public combos
- Admin read-only DB-backed fail-closed
- Retention scheduler + audit 365d; liveness/retention monitors
- Recovery **code path** (dormant without secrets)
- CI: format, lint, typecheck, unit, build, audit, integration, pgTAP, seed replay, e2e

### Blocked external (operator / third party)

- Resend domain + API key + Preview drill + prod secrets (#40)
- Psychometric studies (#43)
- Long-lived staging / PITR / offline `pg_dump` tooling where free-plan limits apply

### Product decisions

- Full Spectrum redesign or permanent draft (#42)
- Whether/when to enable mandatory email verification after delivery works
- Whether/when to fund AI narrative (#45)

### Human-only work

- Formal language/construct/bias review for six guarded modules (#41)
- Manual screen-reader pass + optional WCAG auditor (#44)

## Rollback Complex / precision

See `.pi/HANDOFF.md` CAS `set_feature_flag_state(..., true, false, ...)` snippets.

## Explicit non-claims

- Not clinical; not psychometrically validated.
- Not WCAG third-party certified.
- Full Spectrum not selectable as one preset.
- Email recovery not delivered until secrets set.
- Six guarded modules remain draft item review + `guardedBeta`.
- Not 100% PRD complete.

## Related

- Operator SQL: `PRODUCTION_POSTCHECK_SQL.md`
- Ops recovery: `docs/operations/OPERATIONS_RUNBOOK.md`
- Content workflow: `docs/operations/CONTENT_PUBLICATION_WORKFLOW.md`
- Agent checkpoint: `.pi/HANDOFF.md`, `.pi/EVIDENCE.md`

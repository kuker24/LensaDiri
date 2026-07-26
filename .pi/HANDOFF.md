# Project Handoff — maintenance mode

> Tag `v0.9.0-hobby-modular` · `main` @ `1e59de4` · 2026-07-26.

## Mode: MAINTENANCE

Engineering hobby modular lens is **done**. Do **not** add large product features.

| Lens                                | Status                           |
| ----------------------------------- | -------------------------------- |
| Hobby modular engineering           | **100% closed**                  |
| Full PRD product                    | **~72%** — residual #40–#45 only |
| Clinical / psychometric / WCAG cert | **Never claim**                  |

## In scope (maintenance only)

| Work                        | Notes                                      |
| --------------------------- | ------------------------------------------ |
| Security patches            | Fail-closed; no secret leakage             |
| Dependency updates          | Prefer pin + `npm audit`; small PR         |
| Monitoring / health         | Liveness, structured ops events            |
| Retention cron              | Observe provider; fix-forward only         |
| Regression tests            | Unit / integration / e2e / pgTAP as needed |
| Backup/restore readiness    | Disposable drill; no prod reset            |
| Residual issues **#40–#45** | Operator/human/product/external only       |

## Out of scope

- New modules, scoring engines, major UI redesign, AI ON without #45 prerequisites
- Fake formal item `approved`, Full Spectrum publish over cap, clinical/WCAG claims
- Production DB reset or reverse migrations

## Change rules

1. **Small PR** — one concern; squash merge
2. **CI green** — format, lint, typecheck, unit, build, audit; DB/e2e when touch path needs it
3. **Rollback clear** — flag CAS / prior Vercel deploy / env remove (see `RELEASE_ROLLBACK.md`)
4. **No secrets** in chat, git, or issues
5. **Honest language** — reflective tool, not diagnosis

## Production posture (stable)

Composer **ON** · Complex **ON** · Provisional precision **ON** · AI **OFF**
Recovery delivery **dormant** · mandatory email verify **OFF**
Migrations through `202607290001` · URL `https://lensadiri.vercel.app`

## Residual backlog (only)

| #   | Class          | Topic                                 |
| --- | -------------- | ------------------------------------- |
| 40  | operator       | Resend Preview→prod + optional verify |
| 41  | human          | Formal review 6 guarded modules       |
| 42  | product        | Full Spectrum redesign/decision       |
| 43  | external       | Psychometrics program                 |
| 44  | human/external | Manual a11y / WCAG cert               |
| 45  | deferred       | AI narrative                          |

## Day-2 ops pointers

- Runbook: `docs/operations/OPERATIONS_RUNBOOK.md`
- Rollback: `docs/deployment/RELEASE_ROLLBACK.md`
- Gates: `docs/deployment/RELEASE_CLOSURE_GATES.md`
- Backup: `docs/operations/BACKUP_RESTORE_RUNBOOK.md`
- Changelog: `CHANGELOG.md`

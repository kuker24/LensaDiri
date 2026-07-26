# Project Handoff — maintenance mode

> Tag `v0.9.0-hobby-modular` · residual hobby close · 2026-07-26.

## Mode: MAINTENANCE

Engineering hobby modular lens is **done**. Do **not** add large product features.

| Lens                                | Status                                      |
| ----------------------------------- | ------------------------------------------- |
| Hobby modular engineering           | **100% closed**                             |
| Full PRD product                    | **~75%** — operator/human/external residual |
| Clinical / psychometric / WCAG cert | **Never claim**                             |

## Last maintenance cycle (1)

| Check               | Result                                      |
| ------------------- | ------------------------------------------- |
| Base SHA            | cycle 1 merged `66cc9d5`                    |
| `npm audit`         | 0 vulnerabilities                           |
| Local gates         | format/lint/typecheck/unit 157 / build PASS |
| Prod health + smoke | PASS                                        |
| Code changes        | next 16.2.12; health monitor timeout 25s    |

## Residual hobby close (docs)

Index: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`.

| #   | Label               | Artifact                                          |
| --- | ------------------- | ------------------------------------------------- |
| 40  | BLOCKED_OPERATOR    | `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`  |
| 41  | BLOCKED_HUMAN       | `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md` |
| 42  | **DECIDED**         | `docs/product/FULL_SPECTRUM_CAPACITY_DECISION.md` |
| 43  | PREP_ONLY           | `docs/science/PSYCHOMETRIC_VALIDATION_PREP.md`    |
| 44  | checklist / no cert | `docs/qa/MANUAL_A11Y_CHECKLIST.md`                |
| 45  | **DEFERRED_OFF**    | `docs/product/AI_NARRATIVE_FREE_TIER_STANCE.md`   |

No secrets set. No fake `approved`. No Full Spectrum publish. AI OFF.

## In scope (maintenance only)

| Work                     | Notes                                      |
| ------------------------ | ------------------------------------------ |
| Security patches         | Fail-closed; no secret leakage             |
| Dependency updates       | Prefer pin + `npm audit`; small PR         |
| Monitoring / health      | Liveness, structured ops events            |
| Retention cron           | Observe provider; fix-forward only         |
| Regression tests         | Unit / integration / e2e / pgTAP as needed |
| Backup/restore readiness | Disposable drill; no prod reset            |
| Residual #40–#45         | Operator/human only; use residual docs     |

## Out of scope

- New modules, scoring engines, major UI redesign, AI ON without #45 prerequisites
- Fake formal item `approved`, Full Spectrum publish over cap, clinical/WCAG claims
- Production DB reset or reverse migrations
- Paid services for residual close

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

## Day-2 ops pointers

- Residual close: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`
- Runbook: `docs/operations/OPERATIONS_RUNBOOK.md`
- Rollback: `docs/deployment/RELEASE_ROLLBACK.md`
- Gates: `docs/deployment/RELEASE_CLOSURE_GATES.md`
- Backup: `docs/operations/BACKUP_RESTORE_RUNBOOK.md`
- Changelog: `CHANGELOG.md`

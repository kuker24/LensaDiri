# Project Handoff - frontend redesign active

> **Final hobby release:** `main` @ **`c535a6b`** | tag **`v1.0.0-hobby-final`** | 2026-07-26
> Product freeze baseline: `ab2fcdc` | eng baseline: `v0.9.0-hobby-modular`
> **Freeze reopened:** 2026-07-26 for an approved frontend-only total redesign. Backend/domain remains frozen.

## Status: FRONTEND REDESIGN / BACKEND MAINTENANCE

Hobby project **engineering + release finalization: 100% complete.**
Full PRD product still **stops honestly at ~75%** (external residual only).
Clinical / psychometric / WCAG cert: **never claim.**

| Lens                                | Status                                   |
| ----------------------------------- | ---------------------------------------- |
| Hobby modular engineering           | **100% closed**                          |
| Final hobby release tag             | **`v1.0.0-hobby-final` @ `c535a6b`**     |
| Frontend redesign                   | **ACTIVE** - approved total UI/UX pass   |
| Full PRD product                    | **Stops ~75%** - not 100%                |
| Backend/domain scope                | **FROZEN** - maintenance triggers only   |
| Clinical / psychometric / WCAG cert | **Never claim**                          |
| AI narrative                        | **OFF** unless #45 reopened with funding |

## Release pin

| Field         | Value                                             |
| ------------- | ------------------------------------------------- |
| SHA           | `c535a6bd04140d079bf2f34289f0be5031637830`        |
| Short         | `c535a6b`                                         |
| Tag           | `v1.0.0-hobby-final`                              |
| URL           | https://lensadiri.vercel.app                      |
| Migrations    | Local==Remote through `202607290001`              |
| Flags         | Composer / Complex / provisional precision **ON** |
| AI            | **OFF**                                           |
| Recovery      | Code live; Resend delivery **dormant**            |
| Modules       | 10 selectable; 6 guardedBeta; items draft         |
| Combos        | 5 public; `deep_self_discovery` pilot             |
| Full Spectrum | **draft** (DECIDED multi-session; #42 closed)     |

## In scope (only - reactive maintenance)

Approved exception: total frontend visual/UX redesign may change presentation, layout, copy, and semantic UI while preserving routes, APIs, DTOs, scoring, privacy, authorization, and legacy compatibility.

| Work                     | Notes                                      |
| ------------------------ | ------------------------------------------ |
| Security patches         | Fail-closed; no secret leakage             |
| Dependency updates       | Prefer pin + `npm audit`; small PR         |
| Health / monitoring      | Liveness, structured ops events            |
| Retention cron           | Observe provider; fix-forward only         |
| Backup/restore readiness | Disposable drill; no prod reset            |
| Regression tests         | Unit / integration / e2e / pgTAP as needed |

Trigger only: CVE | critical dep | health fail | monitor alert | retention | backup risk | regression.
Every change: **small PR | CI green | clear rollback | health 200**.

## Out of scope (hard ban)

- Large product features, new modules, scoring engines, major UI redesign
- Paid services / bought email|LLM|auditor for residual close
- Enable `FEATURE_AI_NARRATIVE` without funded consent/provider/fallback
- WCAG or psychometric **certification claims** without external evidence
- Publish / bulk-`approved` modules without human reviewers
- Force-publish `full_spectrum` over Complex cap 120
- Production DB reset or reverse migrations
- Continuous standing-watch sprints without a real trigger

## Residual (external / optional - not blockers)

Process docs exist. **Do not block archive or maintenance** on these.

| #   | Class             | Topic                           | Doc                                               |
| --- | ----------------- | ------------------------------- | ------------------------------------------------- |
| 40  | operator optional | Resend free-tier delivery       | `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`  |
| 41  | human optional    | Formal review 6 guarded modules | `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md` |
| 43  | external optional | Psychometrics beyond prep       | `docs/science/PSYCHOMETRIC_VALIDATION_PREP.md`    |
| 44  | human optional    | Manual a11y / WCAG cert         | `docs/qa/MANUAL_A11Y_CHECKLIST.md`                |

Closed product residuals: **#42** DECIDED multi-session | **#45** DEFERRED_OFF.

Index: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`.

## Change rules

1. **Small PR** - one concern; squash merge
2. **CI green** - format, lint, typecheck, unit, build, audit; DB/e2e when path needs it
3. **Rollback clear** - prior Vercel deploy / flag CAS / env remove (`RELEASE_ROLLBACK.md`)
4. **No secrets** in chat, git, or issues
5. **Honest language** - reflective tool, not diagnosis; full PRD stays ~75% until external evidence

## Day-2 ops

- Residual index: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`
- Gates: `docs/deployment/RELEASE_CLOSURE_GATES.md`
- Runbook: `docs/operations/OPERATIONS_RUNBOOK.md`
- Rollback: `docs/deployment/RELEASE_ROLLBACK.md`
- Backup: `docs/operations/BACKUP_RESTORE_RUNBOOK.md`
- Changelog: `CHANGELOG.md`

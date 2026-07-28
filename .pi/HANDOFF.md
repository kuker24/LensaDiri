# Project Handoff - Maintenance only

> **Current maintenance baseline:** `main` @ **`3ce060a`** | dashboard/auth reliability closed | 2026-07-28
> **Final hobby release baseline:** `main` @ **`c535a6b`** | tag **`v1.0.0-hobby-final`** | 2026-07-26
> Product freeze baseline: `ab2fcdc` | eng baseline: `v0.9.0-hobby-modular`
> **Frontend exception closed:** the approved redesign and dashboard/auth reliability follow-up are complete. Backend/domain remains frozen.
> **Design2 implementation:** `982067b` | polish live `9e638ec` | 2026-07-27

## Status: MAINTENANCE ONLY

Hobby project **engineering + release finalization: 100% complete.**
Full PRD product still **stops honestly at ~75%** (external residual only).
Clinical / psychometric / WCAG cert: **never claim.**

| Lens                                | Status                                   |
| ----------------------------------- | ---------------------------------------- |
| Hobby modular engineering           | **100% closed**                          |
| Final hobby release tag             | **`v1.0.0-hobby-final` @ `c535a6b`**     |
| Frontend redesign                   | **COMPLETE** - Design2 live + polish     |
| Dashboard/auth reliability          | **COMPLETE** - `main` @ `3ce060a`        |
| Full PRD product                    | **Stops ~75%** - not 100%                |
| Backend/domain scope                | **FROZEN** - maintenance triggers only   |
| Clinical / psychometric / WCAG cert | **Never claim**                          |
| AI narrative                        | **OFF** unless #45 reopened with funding |

## Design2 Implementation Pin

| Field         | Value                                             |
| ------------- | ------------------------------------------------- |
| SHA           | `9e638ec9a2fa6b77de63e34c8bef9d5eb4cc80f7`        |
| Short         | `9e638ec`                                         |
| Design2 base  | `982067b` (portal redesign)                       |
| Baseline tag  | `v1.0.0-hobby-final` @ `c535a6b`                  |
| URL           | https://lensadiri.vercel.app                      |
| Migrations    | Local==Remote through `202607290001`              |
| Flags         | Composer / Complex / provisional precision **ON** |
| AI            | **OFF**                                           |
| Recovery      | Code live; Resend delivery **dormant**            |
| Modules       | 10 selectable; 6 guardedBeta; items draft         |
| Combos        | 5 public; `deep_self_discovery` pilot             |
| Full Spectrum | **draft** (DECIDED multi-session; #42 closed)     |

## Redesign Outcome

- Design2 monochrome portal shell, cinematic landing media, route-aware chrome, and calm task surfaces are live.
- Follow-up polish (`3805c67`+) adds cinematic motion foundation, shorter UI copy, and shell consistency across auth/assessment/result/dashboard/admin.
- Composer is linear and result reports are synthesis-first with technical detail behind progressive disclosure.
- Branded loading, error, not-found, catalog, session, and result recovery states are implemented.
- Indonesian UI jargon cleanup and shared button/badge/progress geometry cleanup are complete.
- Full chronology, route coverage, media inventory, verification, deployment, and known limits: `.pi/FRONTEND_REDESIGN_PROGRESS.md`.

## Dashboard/Auth Reliability Closure

- PR [#65](https://github.com/kuker24/LensaDiri/pull/65) squash-merged into `main` as `3ce060a015b331d2799861d7a466b5663bd4af86` after merge state `CLEAN`.
- PR CI [30369143103](https://github.com/kuker24/LensaDiri/actions/runs/30369143103) passed Quality/build/audit plus disposable DB, integration, pgTAP, seed replay, Playwright desktop/Pixel 5, and accessibility.
- Post-merge `main` CI [30370036507](https://github.com/kuker24/LensaDiri/actions/runs/30370036507) repeated the full gate successfully.
- Vercel Preview and production deployment passed. [Post-merge production verification](https://github.com/kuker24/LensaDiri/pull/65#issuecomment-5106109050) records desktop login → dashboard → home → dashboard → reload without session loss.
- The same production evidence records hard-delete of the throwaway verification account; no test account was retained.
- Production liveness [30371184573](https://github.com/kuker24/LensaDiri/actions/runs/30371184573) passed on `3ce060a`; `GET /api/health` returned HTTP 200 with `{"status":"ok"}`.
- No DB, migration, environment, feature-flag, scoring, or product-feature change was part of this closure.

## In Scope (reactive maintenance only)

The approved redesign exception and dashboard/auth reliability fix are complete. Further work requires a concrete regression, accessibility, security, dependency, health, monitoring, retention, or backup trigger.

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

## Out Of Scope (hard ban)

- Large product features, new modules, scoring engines, or another unapproved total redesign
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
- Frontend redesign log: `.pi/FRONTEND_REDESIGN_PROGRESS.md`

# Project Handoff — final hobby freeze

> **Final hobby release pin:** `main` @ **`ab2fcdc`** · 2026-07-26
> Tag eng baseline: `v0.9.0-hobby-modular` · residual close: PR #50

## Mode: MAINTENANCE ONLY

This SHA is the **final hobby product freeze**. Do **not** treat residual external work as incomplete engineering.

| Lens                                | Status                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| Hobby modular engineering           | **100% closed** at freeze pin                                 |
| Full PRD product                    | **Stops honestly at ~75%** — not 100%                         |
| Clinical / psychometric / WCAG cert | **Never claim**                                               |
| AI narrative                        | **OFF** forever on free tier unless #45 reopened with funding |

## Freeze pin

| Field         | Value                                             |
| ------------- | ------------------------------------------------- |
| SHA           | `ab2fcdc80275594a2ed93636d346691b28abf6cb`        |
| Short         | `ab2fcdc`                                         |
| URL           | https://lensadiri.vercel.app                      |
| Migrations    | Local==Remote through `202607290001`              |
| Flags         | Composer · Complex · provisional precision **ON** |
| AI            | **OFF**                                           |
| Recovery      | Code live; Resend delivery **dormant**            |
| Modules       | 10 selectable; 6 guardedBeta; items draft         |
| Combos        | 5 public; `deep_self_discovery` pilot             |
| Full Spectrum | **draft** (DECIDED multi-session; #42 closed)     |

## In scope (only)

| Work                     | Notes                                      |
| ------------------------ | ------------------------------------------ |
| Security patches         | Fail-closed; no secret leakage             |
| Dependency updates       | Prefer pin + `npm audit`; small PR         |
| Health / monitoring      | Liveness, structured ops events            |
| Retention cron           | Observe provider; fix-forward only         |
| Backup/restore readiness | Disposable drill; no prod reset            |
| Regression tests         | Unit / integration / e2e / pgTAP as needed |

Every change: **small PR · CI green · clear rollback**.

## Out of scope (hard ban)

- Large product features, new modules, scoring engines, major UI redesign
- Paid services / bought email·LLM·auditor for residual close
- Enable `FEATURE_AI_NARRATIVE` without funded consent/provider/fallback
- WCAG or psychometric **certification claims** without external evidence
- Publish / bulk-`approved` modules without human reviewers
- Force-publish `full_spectrum` over Complex cap 120
- Production DB reset or reverse migrations

## Residual (external / optional only)

Process docs exist. **Do not block maintenance** on these.

| #   | Class             | Topic                           | Doc                                               |
| --- | ----------------- | ------------------------------- | ------------------------------------------------- |
| 40  | operator optional | Resend free-tier delivery       | `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`  |
| 41  | human optional    | Formal review 6 guarded modules | `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md` |
| 43  | external optional | Psychometrics beyond prep       | `docs/science/PSYCHOMETRIC_VALIDATION_PREP.md`    |
| 44  | human optional    | Manual a11y / WCAG cert         | `docs/qa/MANUAL_A11Y_CHECKLIST.md`                |

Closed product residuals: **#42** DECIDED multi-session · **#45** DEFERRED_OFF.

Index: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`.

## Change rules

1. **Small PR** — one concern; squash merge
2. **CI green** — format, lint, typecheck, unit, build, audit; DB/e2e when path needs it
3. **Rollback clear** — prior Vercel deploy / flag CAS / env remove (`RELEASE_ROLLBACK.md`)
4. **No secrets** in chat, git, or issues
5. **Honest language** — reflective tool, not diagnosis; full PRD stays ~75% until external evidence

## Day-2 ops

- Freeze + residual: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`
- Gates: `docs/deployment/RELEASE_CLOSURE_GATES.md`
- Runbook: `docs/operations/OPERATIONS_RUNBOOK.md`
- Rollback: `docs/deployment/RELEASE_ROLLBACK.md`
- Backup: `docs/operations/BACKUP_RESTORE_RUNBOOK.md`
- Changelog: `CHANGELOG.md`

# Release Closure Gates

Honest matrix of what is production-live versus what still needs external work or separate approval. Engineering completeness ≠ product “100%” sign-off.

Checkpoint: `main` @ `3eb53bc` (2026-07-26). Update this file when a gate changes with evidence.

## Live in production (do not re-activate)

| Area                                   | Evidence                                           |
| -------------------------------------- | -------------------------------------------------- |
| Hobby baseline + legacy Quick/Standard | Public app + CI                                    |
| Modular composer                       | `FEATURE_MODULAR_COMPOSER` ON; estimate/start flow |
| Guarded 10 modules selectable          | `/api/modules`, public CTAs                        |
| Migrations through `202607290001`      | linked migration list                              |
| Retention cleanup + audit 365d         | #28–#34 evidence                                   |
| Observability health + issue alerts    | workflow drills                                    |
| Recovery foundation (dormant delivery) | #35 code; no secrets                               |
| Admin read-only DB views               | #36; guest redirect                                |

## Gate matrix

| Gate                      | Engineering              | Production                | Blocker                          | Approval needed                                    | Rollback                             |
| ------------------------- | ------------------------ | ------------------------- | -------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Resend Preview drill      | CODE_READY               | NOT RUN                   | Resend domain/API key            | Preview secrets only                               | Remove Preview env + redeploy        |
| Production email delivery | CODE_READY               | DORMANT                   | Preview evidence                 | Production `EMAIL_FROM` + `RESEND_API_KEY`         | Remove secrets + redeploy            |
| Mandatory verification    | CODE_READY flag OFF      | OFF                       | Delivery + legacy plan           | `FEATURE_REQUIRE_EMAIL_VERIFICATION=1`             | Set `0`/unset + redeploy             |
| Complex mode              | CODE_READY flag OFF      | OFF                       | Product window                   | `set_feature_flag_state('FEATURE_COMPLEX_MODE',…)` | CAS back to false                    |
| Deep preset publish       | Draft preset             | Hidden                    | Complex ON + coverage            | `publish_combo_preset` after gates                 | Keep draft / retire version          |
| Full Spectrum             | Draft; over cap          | Hidden                    | Capacity + experimental ack      | Product + content workflow                         | Keep draft                           |
| Provisional precision     | CODE_READY flag OFF      | OFF                       | Product                          | `FEATURE_PROVISIONAL_PRECISION`                    | CAS false                            |
| Formal review 6 modules   | Workflow SQL ready       | Items draft / guardedBeta | Human reviewers                  | Per-item transitions; no fake approved             | Stay draft                           |
| Psychometric validation   | N/A                      | Not claimed               | External study                   | Domain experts                                     | Honest evidence tiers only           |
| Manual a11y               | Auto suite PASS          | Manual open               | Human SR/contrast                | Auditor time                                       | Keep engineering baseline claim only |
| Direct DB postcheck       | SQL pack ready           | Partial API postcheck     | Trusted DB session               | Operator run                                       | Read-only                            |
| Restore drill final       | Staging drill 2026-07-23 | Disposable torn down      | Re-provision cost; PITR external | Operator                                           | No prod restore                      |
| Issue/docs cleanup        | This docs slice          | Ongoing                   | Maintainer                       | Close epics with residual links                    | N/A                                  |
| Release closure sign-off  | Docs freeze              | Partial                   | Remaining gates                  | Product owner                                      | Per-gate rollback                    |

## Ordered activation (never skip)

1. **Resend Preview** — domain/sender verified; Preview-only secrets; disposable inbox; single-use + replay fail; anti-enum still `202`.
2. **Production email** — after Preview evidence; secrets only; verification flag still OFF.
3. **Mandatory verification** — after delivery + legacy communication plan.
4. **Direct DB postcheck** — run `PRODUCTION_POSTCHECK_SQL.md` read-only; record results in audit/evidence.
5. **Complex mode** — monitoring + rollback owner active; CAS flag ON; smoke deep estimate + pause/resume.
6. **Deep preset** — only if coverage fits Complex; publish via workflow; Full Spectrum only if product accepts capacity/experimental rules.
7. **Provisional precision** — optional; disclaimer copy already in estimate path when flag ON.
8. **Formal six-module review** — language → construct → bias → pilot → approved; then version publish if RELEASE_READY.
9. **Manual a11y + psychometrics** — external; do not claim WCAG cert or validated instrument.
10. **Release closure** — product signs residual risk list; freeze claims in PRD audit + this matrix.

## Explicit non-claims

- Not a clinical instrument; not psychometrically validated.
- Not WCAG third-party certified (engineering automated baseline only).
- AI narrative not available (`FEATURE_AI_NARRATIVE` OFF).
- Full Spectrum not selectable as one preset while draft/over capacity.
- Email recovery not delivered until secrets set.

## Related docs

- Activation steps: `docs/operations/OPERATIONS_RUNBOOK.md` (recovery), `docs/operations/CONTENT_PUBLICATION_WORKFLOW.md` (flags/content)
- Modular posture: `docs/deployment/MODULAR_RELEASE_READINESS.md`
- Operator SQL: `docs/deployment/PRODUCTION_POSTCHECK_SQL.md`
- Env contract: `docs/deployment/PRODUCTION_VERCEL_SUPABASE.md`
- A11y residual: `docs/qa/ACCESSIBILITY_AUDIT.md`

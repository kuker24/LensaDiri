# Release Closure Gates

Honest matrix of production-live vs residual external work. Engineering completeness ≠ formal psychometric or WCAG certification.

Checkpoint: `main` @ `f501630` (2026-07-26).

## Live in production

| Area                                   | Evidence                                                       |
| -------------------------------------- | -------------------------------------------------------------- |
| Hobby baseline + legacy Quick/Standard | Public app + CI                                                |
| Modular composer                       | `FEATURE_MODULAR_COMPOSER` ON                                  |
| Complex mode                           | `FEATURE_COMPLEX_MODE` **ON**; deep selectable via #38         |
| Provisional precision                  | `FEATURE_PROVISIONAL_PRECISION` **ON**; bands on mode profiles |
| Guarded 10 modules                     | API + DB postcheck                                             |
| Deep preset                            | `deep_self_discovery` **pilot** (not formal published)         |
| Migrations through `202607290001`      | linked list                                                    |
| Retention + audit 365d                 | #28–#34                                                        |
| Admin read-only                        | #36                                                            |
| Recovery foundation                    | #35 code; delivery dormant                                     |

## Gate matrix

| Gate                    | Production            | Status                                       |
| ----------------------- | --------------------- | -------------------------------------------- |
| Resend Preview drill    | NOT RUN               | **BLOCKED** — no operator Resend credentials |
| Production email        | DORMANT               | After Preview                                |
| Mandatory verification  | OFF                   | After delivery + legacy plan                 |
| Complex mode            | **ON**                | Done 2026-07-26                              |
| Deep preset             | **pilot**             | Done (not formal published)                  |
| Full Spectrum           | draft                 | **BLOCKED** — over Complex cap               |
| Provisional precision   | **ON**                | Done 2026-07-26                              |
| Formal review 6 modules | draft items           | **BLOCKED_HUMAN**                            |
| Psychometric validation | not claimed           | **BLOCKED_EXTERNAL**                         |
| Manual a11y / WCAG cert | auto PASS only        | **BLOCKED_EXTERNAL**                         |
| Direct DB postcheck     | **DONE** 2026-07-26   | draft 147+147; guardedBeta×6; flags recorded |
| Restore drill           | 2026-07-23 disposable | Re-provision when needed; PITR external      |
| AI narrative            | OFF                   | Deferred                                     |
| Issue cleanup           | epics #2/#4/#5 closed | Done                                         |

## Rollback Complex / precision

See `.pi/HANDOFF.md` CAS false snippets.

## Explicit non-claims

- Not clinical; not psychometrically validated.
- Not WCAG third-party certified.
- Full Spectrum not selectable as one preset.
- Email recovery not delivered until secrets set.
- Six guarded modules remain draft item review + guardedBeta.

## Related

- Operator SQL: `PRODUCTION_POSTCHECK_SQL.md`
- Ops recovery: `docs/operations/OPERATIONS_RUNBOOK.md`
- Content workflow: `docs/operations/CONTENT_PUBLICATION_WORKFLOW.md`

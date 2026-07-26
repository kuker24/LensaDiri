# Release Closure Gates

Honest matrix: production-live engineering vs residual external / product / human work.

**Final hobby release:** `main` @ **`c535a6b`** | tag **`v1.0.0-hobby-final`** | 2026-07-26.
**Product freeze baseline:** `ab2fcdc` | eng baseline **`v0.9.0-hobby-modular`**.
**Mode:** **ARCHIVED / MAINTENANCE** - reactive security/deps/health/monitoring/retention/backup readiness/regression tests only. Standing watch **CLOSED**.
**Production:** `https://lensadiri.vercel.app` | migrations Local==Remote through `202607290001`.
**Rollback:** `docs/deployment/RELEASE_ROLLBACK.md` | **Changelog:** `CHANGELOG.md` | **Handoff:** `.pi/HANDOFF.md`.
**Residual index:** `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`.

## Release-ready status

| Lens                                 | Status                                             | Completion            |
| ------------------------------------ | -------------------------------------------------- | --------------------- |
| **Hobby modular engineering**        | **YES** - closed                                   | **100% of this lens** |
| **Final hobby release / archive**    | **YES** - `v1.0.0-hobby-final` @ `c535a6b`         | **100%**              |
| **PRD v2.0 full product completion** | **STOPPED ~75%** - residual external/optional only | **~75%** weighted     |
| **Scientific / WCAG certification**  | **NO**                                             | **0%** formal claims  |

**Hobby project finalization = 100% complete at `c535a6b` / `v1.0.0-hobby-final`.** Full PRD **stops honestly at ~75%**. Residual **#40 #41 #43 #44** are operator/human/external **optional - not blockers**. **#42** DECIDED | **#45** DEFERRED_OFF.

### Weight model (audit 2026-07-26 | residual close same day)

| Bucket                                       | Weight | Done | Notes                                                      |
| -------------------------------------------- | ------ | ---- | ---------------------------------------------------------- |
| Legacy + auth + security baseline            | 25     | 100% | Argon2id, CSRF, RLS forced, private results                |
| Modular composer + 10 engines + scoring      | 25     | 100% | Server-authoritative; independent modules                  |
| Complex + provisional precision + deep pilot | 10     | 100% | Flags ON; deep selectable (#38)                            |
| Admin read-only + retention + monitors       | 10     | 100% | #28-#36                                                    |
| Recovery email **delivery**                  | 8      | ~35% | Code #35; free-tier runbook; secrets still operator        |
| Formal review 6 guarded modules              | 8      | ~15% | draft 147+147; review packet ready; no fake approve        |
| Full Spectrum product path                   | 5      | ~80% | **DECIDED** draft + multi-session; no publish over cap #42 |
| Psychometric validation                      | 4      | ~15% | Prep protocol only; not validated #43                      |
| Manual a11y / WCAG cert                      | 3      | ~50% | auto PASS; manual checklist; no cert #44                   |
| AI narrative                                 | 2      | ~50% | flag OFF; free-tier **DEFERRED** stance documented #45     |

Weighted full-product total ≈ **~75%**.
Hobby modular **engineering lens** = **100% of that lens** - residual weight is operator/human/external only.

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
| Retention + audit 365d                 | #28-#34                                                  |
| Admin read-only                        | #36                                                      |
| Recovery foundation                    | #35 code; delivery dormant                               |
| Activation + closure docs              | #39, #46 @ `bdeeec5`; tag `v0.9.0-hobby-modular`         |

## Gate matrix

| Gate                                              | Production                       | Owner class           | Tracking | Status                  |
| ------------------------------------------------- | -------------------------------- | --------------------- | -------- | ----------------------- |
| Direct DB postcheck                               | DONE 2026-07-26                  | eng                   | -        | **DONE**                |
| Complex mode                                      | ON                               | eng                   | -        | **DONE**                |
| Provisional precision                             | ON                               | eng                   | -        | **DONE**                |
| Deep preset                                       | pilot                            | eng                   | -        | **DONE**                |
| Issue hygiene (epics)                             | #2/#4/#5 closed                  | eng                   | -        | **DONE**                |
| Residual issue split                              | #40-#45 tracked                  | eng                   | -        | **DONE** 2026-07-26     |
| Residual hobby close docs                         | process + decisions              | eng                   | residual | **DONE** 2026-07-26     |
| Final hobby freeze pin                            | `ab2fcdc`                        | eng                   | freeze   | **DONE** 2026-07-26     |
| Final hobby release tag                           | `v1.0.0-hobby-final` @ `c535a6b` | eng                   | archive  | **DONE** 2026-07-26     |
| Standing watch closed                             | reactive only                    | eng                   | archive  | **DONE** 2026-07-26     |
| Resend Preview → prod → optional mandatory verify | dormant; free runbook            | **operator optional** | **#40**  | **OPTIONAL**            |
| Formal review 6 modules                           | draft; packet ready              | **human optional**    | **#41**  | **OPTIONAL**            |
| Full Spectrum                                     | draft; multi-session             | **product**           | **#42**  | **DECIDED closed**      |
| Psychometric validation                           | prep only; not claimed           | **external optional** | **#43**  | **OPTIONAL**            |
| Manual a11y / WCAG cert                           | auto PASS; checklist             | **human optional**    | **#44**  | **OPTIONAL**            |
| AI narrative                                      | OFF free-tier stance             | **deferred**          | **#45**  | **DEFERRED_OFF closed** |
| Long-lived staging / PITR / `pg_dump`             | partial                          | external              | ops      | **PARTIAL**             |
| First retention cron observation                  | may be PENDING_PROVIDER          | ops                   | runbook  | **WATCH**               |

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

- Resend free-tier domain + API key + Preview drill + prod secrets (#40) - runbook: `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`
- Psychometric studies beyond prep (#43) - prep: `docs/science/PSYCHOMETRIC_VALIDATION_PREP.md`
- Long-lived staging / PITR / offline `pg_dump` tooling where free-plan limits apply

### Product decisions

- Full Spectrum: **DECIDED** keep draft; multi-session path - `docs/product/FULL_SPECTRUM_CAPACITY_DECISION.md`
- Whether/when to enable mandatory email verification after delivery works
- AI narrative: **DEFERRED_OFF** free tier - `docs/product/AI_NARRATIVE_FREE_TIER_STANCE.md`

### Human-only work

- Formal language/construct/bias review for six guarded modules (#41) - packet: `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md`
- Manual screen-reader pass + optional WCAG auditor (#44) - checklist: `docs/qa/MANUAL_A11Y_CHECKLIST.md`

## Rollback Complex / precision

See `.pi/HANDOFF.md` CAS `set_feature_flag_state(..., true, false, ...)` snippets.

## Explicit non-claims

- Not clinical; not psychometrically validated.
- Not WCAG third-party certified.
- Full Spectrum not selectable as one preset (multi-session only).
- Email recovery not delivered until secrets set.
- Six guarded modules remain draft item review + `guardedBeta`.
- AI narrative not enabled (free-tier OFF).
- Not 100% PRD complete (~75% weighted after residual docs).

## Related

- Residual hobby close: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`
- Operator SQL: `PRODUCTION_POSTCHECK_SQL.md`
- Ops recovery: `docs/operations/OPERATIONS_RUNBOOK.md`
- Content workflow: `docs/operations/CONTENT_PUBLICATION_WORKFLOW.md`
- Agent checkpoint: `.pi/HANDOFF.md`, `.pi/EVIDENCE.md`

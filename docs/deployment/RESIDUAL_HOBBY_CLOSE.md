# Residual hobby close (#40–#45)

**Final hobby release:** `main` @ **`c535a6b`** · tag **`v1.0.0-hobby-final`** · 2026-07-26
**Product freeze baseline:** `ab2fcdc`
**Constraint:** free/hobby only · no purchased services · no fake cert/review/validation · AI not paid
**Mode:** **ARCHIVED / MAINTENANCE** · standing watch **CLOSED**

## Binding product status

| Lens                                 | Status                                       |
| ------------------------------------ | -------------------------------------------- |
| Hobby modular engineering            | **100% closed**                              |
| Hobby project finalization           | **100% complete** @ `v1.0.0-hobby-final`     |
| Full PRD product                     | **Stops honestly at ~75%** — not 100%        |
| Residual #40 #41 #43 #44             | **External optional — not release blockers** |
| Clinical / WCAG / psychometrics cert | **Never claim**                              |

## Best honest residual matrix

| #   | Topic                  | Engineering / docs                | Owner                    | Freeze label                  | Issue  |
| --- | ---------------------- | --------------------------------- | ------------------------ | ----------------------------- | ------ |
| 40  | Recovery email         | Code + free-tier runbook          | Operator (optional)      | **BLOCKED_OPERATOR** optional | open   |
| 41  | 6-module formal review | Review packet + SQL state machine | Human (optional)         | **BLOCKED_HUMAN** optional    | open   |
| 42  | Full Spectrum          | DECIDED draft + multi-session     | Product                  | **DECIDED**                   | closed |
| 43  | Psychometrics          | Prep protocol only                | External (optional)      | **PREP_ONLY**                 | open   |
| 44  | Manual a11y / WCAG     | Auto PASS + manual checklist      | Human/auditor (optional) | checklist; **no cert**        | open   |
| 45  | AI narrative           | Free-tier OFF stance              | Funding                  | **DEFERRED_OFF**              | closed |

Residual **#40, #41, #43, #44** are **external/optional**. They do **not** reopen the engineering freeze. Do not staff them as eng sprints.

## Weighted product estimate

| Bucket                                                    | Weight | At freeze                                    |
| --------------------------------------------------------- | ------ | -------------------------------------------- |
| Eng baseline (legacy/auth/modular/complex/admin/monitors) | 70     | 100% of those buckets                        |
| Recovery delivery                                         | 8      | ~35% (code + runbook); live only if operator |
| Formal review                                             | 8      | process docs; content still draft            |
| Full Spectrum path                                        | 5      | **DECIDED** multi-session; preset draft      |
| Psychometrics                                             | 4      | prep only                                    |
| Manual a11y / cert                                        | 3      | checklist; 0% cert                           |
| AI                                                        | 2      | explicit OFF                                 |

**Full PRD ≈ ~75%.** Engineering modular lens **100%**.

## Hard bans after freeze

- Large features, new modules/engines, major redesign
- Paid services for residual close
- AI narrative ON without funded #45 prerequisites
- WCAG / psychometric certification claims without external evidence
- Publish or bulk-`approved` modules without reviewers
- `publish_combo_preset(full_spectrum)` while over Complex cap

## Operator next (optional only)

1. `docs/operations/RESEND_FREE_TIER_ACTIVATION.md` if email wanted
2. `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md` if reviewers available
3. `docs/qa/MANUAL_A11Y_CHECKLIST.md` if a human can run SR pass
4. Leave #43 until funded; accept prep forever if not

## Related index

- Freeze handoff: `.pi/HANDOFF.md`
- Gates: `docs/deployment/RELEASE_CLOSURE_GATES.md`
- `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`
- `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md`
- `docs/product/FULL_SPECTRUM_CAPACITY_DECISION.md`
- `docs/science/PSYCHOMETRIC_VALIDATION_PREP.md`
- `docs/qa/MANUAL_A11Y_CHECKLIST.md`
- `docs/product/AI_NARRATIVE_FREE_TIER_STANCE.md`

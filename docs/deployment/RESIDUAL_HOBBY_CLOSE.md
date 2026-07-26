# Residual hobby close (#40–#45)

**Date:** 2026-07-26  
**Constraint:** free/hobby only · no purchased services · no fake cert/review/validation · AI not paid

## Best honest status

| #   | Topic                  | What engineering did                              | Residual owner                                      | Hobby close label                                    |
| --- | ---------------------- | ------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| 40  | Recovery email         | Code + free-tier activation runbook               | **Operator** (Resend free account + Vercel secrets) | **BLOCKED_OPERATOR** until secrets+drill; docs ready |
| 41  | 6-module formal review | Review packet + existing SQL state machine        | **Human reviewers**                                 | **BLOCKED_HUMAN**; packet ready                      |
| 42  | Full Spectrum          | Capacity decision: keep draft; multi-session path | Product (decided)                                   | **DECIDED** multi-session; no publish over cap       |
| 43  | Psychometrics          | Prep protocol only                                | **External/funded**                                 | **PREP_ONLY**; not validated                         |
| 44  | Manual a11y / WCAG     | Manual checklist; auto still PASS                 | **Human** (+ optional auditor)                      | Checklist ready; **no cert**                         |
| 45  | AI narrative           | Explicit free-tier OFF stance                     | Product/funding                                     | **DEFERRED_OFF**                                     |

## Weighted product estimate (same model as gates)

| Bucket                                                    | Weight | After this close                             |
| --------------------------------------------------------- | ------ | -------------------------------------------- |
| Eng baseline (legacy/auth/modular/complex/admin/monitors) | 70     | 100% of those buckets                        |
| Recovery delivery                                         | 8      | ~30% (code) + docs; live only after operator |
| Formal review                                             | 8      | 0% content; 100% process docs                |
| Full Spectrum path                                        | 5      | **~80%** decision+path; preset still draft   |
| Psychometrics                                             | 4      | ~15% prep docs only                          |
| Manual a11y / cert                                        | 3      | ~50% checklist; 0% cert                      |
| AI                                                        | 2      | 0% feature; 100% explicit OFF                |

**Full PRD product still ~74–76%** (not 100%). Hobby modular **engineering** remains **100% closed**. Clinical/WCAG cert **never claimed**.

## What was intentionally not done

- No Resend keys written by agent
- No `approved` item bulk update
- No `publish_combo_preset(full_spectrum)`
- No LLM provider integration
- No self-issued WCAG certificate
- No paid panel / paid auditor

## Operator next (optional)

1. Follow `docs/operations/RESEND_FREE_TIER_ACTIVATION.md` if email delivery wanted.
2. Staff reviewers via `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md`.
3. Run `docs/qa/MANUAL_A11Y_CHECKLIST.md` when a human is available.
4. Leave #43/#45 until funded or accept prep/deferred forever.

## Related index

- `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`
- `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md`
- `docs/product/FULL_SPECTRUM_CAPACITY_DECISION.md`
- `docs/science/PSYCHOMETRIC_VALIDATION_PREP.md`
- `docs/qa/MANUAL_A11Y_CHECKLIST.md`
- `docs/product/AI_NARRATIVE_FREE_TIER_STANCE.md`
- `docs/deployment/RELEASE_CLOSURE_GATES.md`

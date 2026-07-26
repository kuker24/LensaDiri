# AI narrative free-tier stance (#45)

**Decision:** keep `FEATURE_AI_NARRATIVE` **OFF** on production for hobby/free tier.
**Date:** 2026-07-26

## Why OFF is correct

| Gate                        | Free-tier reality                                              |
| --------------------------- | -------------------------------------------------------------- |
| LLM provider cost           | Not free at useful volume; keys = paid/quota risk              |
| Consent + minimization      | Not designed/shipped                                           |
| Fallback when provider down | Not implemented                                                |
| Primary scoring integrity   | Must stay deterministic; AI must never alter scores (PRD §16)  |
| Privacy                     | Narrative prompts risk leaking answers/traits to third parties |

Existing “narrative” in product = **rule-based correlation** after independent module scores (`src/lib/scoring/correlation.ts`). That is **not** generative AI.

## Code state

- Flag seed/default **false**
- No provider SDK / stub LLM runtime in `src/` for narrative generation
- Configuration intent when ever enabled: `requiresConsent`, `primaryScoringForbidden`

## When to reopen (not now)

1. Product + privacy consent design reviewed
2. Provider + budget + rate limits chosen
3. Post-score copy only; scores unchanged; unit tests prove isolation
4. Offline/fallback template path
5. Flag remains default OFF; explicit production activation approval
6. Security review of prompt/log redaction

## Hobby close outcome

| Outcome                            | Issue #45                                     |
| ---------------------------------- | --------------------------------------------- |
| Stay OFF; docs point here          | **deferred / free-tier wontfix-until-funded** |
| Someone enables flag without above | **incident** — reverse flag immediately       |

## Non-claims

- No AI-written clinical interpretation
- No claim that correlation text is model-generated
- No secret API keys in repo for “future AI”

## Related

- Gates: `docs/deployment/RELEASE_CLOSURE_GATES.md`
- Rollback flags: `docs/deployment/RELEASE_ROLLBACK.md`

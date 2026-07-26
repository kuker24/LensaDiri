# Psychometric validation preparation (#43)

**Status:** prep only · **not validated** · free/hobby program sketch  
**Ban:** public copy must not claim reliability, norms, clinical use, or “scientifically proven” from this doc alone.

LensaDiri scoring is **reflective**, original Bahasa Indonesia, server-deterministic. PRD §25 is the product roadmap; this file is the operator/researcher prep checklist for when humans and optional free tooling exist.

## Honesty baseline (do not reverse)

- Evidence tier + provisional precision disclaimer stay in product.
- AI never computes primary scores (`FEATURE_AI_NARRATIVE` OFF; #45).
- Guarded six modules may stay `draft` review until #41 completes.
- No proprietary instrument items.

## Free / low-cost stack

| Need                | Hobby option                                                                |
| ------------------- | --------------------------------------------------------------------------- |
| Protocol + codebook | This doc + spreadsheet                                                      |
| Consent             | Existing privacy/disclaimer; add study-specific consent text before collect |
| Sample              | Opt-in volunteers; no paid panel required for pilot-0                       |
| Analysis            | R / Python / jamovi (free); spreadsheet for item means                      |
| Storage             | Export allowlist only; no raw answers in git/issues                         |
| Expert review       | Volunteer domain reader if available; else mark BLOCKED_HUMAN               |

## Pre-pilot (can start free)

1. **Construct dictionary** per module key (label, facet, polarity rules) — from seeds + scoring engines under `src/lib/scoring/modules/`.
2. **Item bank inventory:** `item_code`, construct, polarity, review_status (join via admin read-only or disposable DB).
3. **Language + bias pass** — prefer complete #41 first for guarded six.
4. **Cognitive interview n≈5–10:** think-aloud on 1–2 modules; note confusion; no score claims.
5. **Timing calibration:** use estimate minutes vs real completion (private analytics only if already instrumented; else manual log).

## Pilot 1 (still non-validating)

| Gate        | Target (indicative, not cert)                | Output                                |
| ----------- | -------------------------------------------- | ------------------------------------- |
| n           | Prefer ≥100 completes per module under study | Drop rules for missing/speeding       |
| Item stats  | mean, SD, item-total r                       | Flag floor/ceiling items              |
| Reliability | Cronbach/α or ω **exploratory only**         | Internal note; not public “validated” |
| Composer    | Coverage failures rate                       | Fix quotas via additive versions only |

## Pilot 2 / validation (usually external budget)

- EFA/CFA, test-retest window, DIF, norming, technical manual — **BLOCKED_EXTERNAL / funded**.
- Public precision language may tighten **only after** archived results + product approval.

## Data rules

- Prefer account-owned export path user initiates; no bulk scrape of production answers into laptops without policy.
- Strip tokens, emails, IP/UA fingerprints before any shared analysis file.
- Do not commit datasets to this repo.

## Metrics map (PRD §25.2 → hobby note)

| Metric                    | Hobby prep                            |
| ------------------------- | ------------------------------------- |
| Item mean/variance        | Spreadsheet after consented export    |
| Missing rate              | Session incomplete vs complete counts |
| Response time             | Only if already stored; else skip     |
| Item-total / α            | After n sufficient; exploratory       |
| Test-retest / DIF / norms | External phase                        |

## Sign-off template (when a study finishes)

| Field               | Value               |
| ------------------- | ------------------- |
| Study id            |                     |
| Modules             |                     |
| n complete          |                     |
| Dates               |                     |
| Analyses run        |                     |
| Public copy change? | yes/no + PR link    |
| Still non-clinical? | **must remain yes** |

## Done when (#43)

- Study protocol + results archived **or** explicit **wontfix-until-funded** with this prep retained
- Public copy still honest
- Issue closed only with evidence, never by aspiration

## Related

- PRD §25: `docs/product/PRD_FULL_LensaDiri.md`
- Content review: `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md`
- Non-claims: `docs/deployment/RELEASE_CLOSURE_GATES.md`

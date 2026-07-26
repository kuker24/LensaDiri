# Guarded six-module formal review packet (#41)

Human-only. **Do not bulk-set `approved`.** No auto-approve SQL. Item banks stay reflective original Bahasa Indonesia under `guardedBeta`.

## Scope

| Module key                | Public posture             | Item review (prod) | Notes                     |
| ------------------------- | -------------------------- | ------------------ | ------------------------- |
| `three_center`            | pilot + guardedBeta        | draft              | 3 centers                 |
| `instinct`                | pilot + guardedBeta        | draft              | instinct variants         |
| `riasec`                  | pilot + guardedBeta        | draft              | 6 interests               |
| `attachment`              | pilot + guardedBeta        | draft              | attachment patterns       |
| `socionics_communication` | experimental + guardedBeta | draft              | communication lens        |
| `psychosophy`             | experimental + guardedBeta | draft              | optional experimental ack |

Canonical workflow SQL: `docs/operations/CONTENT_PUBLICATION_WORKFLOW.md`.

State machine (strict; no jumps):

```text
draft → language_review → construct_review → bias_review → pilot → approved | rejected
```

Function: `public.transition_question_review(...)`. Publish only via `publish_module_version` after gates.

## Counts (honesty baseline)

Expect ~**147** questions + **147** ID translations still `review_status='draft'` for the six until real transitions. Confirm with postcheck SQL (`docs/deployment/PRODUCTION_POSTCHECK_SQL.md`), not guesses.

## Reviewer roles (can be one person sequentially on hobby)

| Gate      | Focus                                                           | Ban                                            |
| --------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Language  | Clear ID, no clinical diagnosis, no proprietary instrument copy | Copy-paste from Big Five/MBTI commercial banks |
| Construct | Maps to intended dimension; polarity sensible                   | Claim validated psychometrics                  |
| Bias      | Gender/culture/class/ability; avoid harm                        | Stereotypes as “truth”                         |
| Pilot     | Small internal try; timing/clarity notes                        | Public “scientifically proven” copy            |

## Per-item checklist (print or spreadsheet)

For each `item_code`:

1. [ ] Original wording (not proprietary clone)
2. [ ] Single construct; no double-barrel
3. [ ] Polarity matches scoring note
4. [ ] No diagnosis / absolute identity claim
5. [ ] Readable at ~B1–B2 Indonesian
6. [ ] Sensitive content flagged if needed
7. [ ] Translation ID matches intent
8. [ ] Decision: advance / hold / reject + one-line reason

## Operator transition template

Replace UUIDs. One transaction per transition batch you can audit.

```sql
begin;
select public.transition_question_review(
  '<question-uuid>',
  'draft'::public.review_status,
  'language_review'::public.review_status,
  '<operator-account-uuid>',
  'Language review pass: clarity OK; non-clinical.'
);
commit;
```

Advance only when the **expected** current status matches. Concurrent drift fails closed.

## Module publish (only after all active items + ID translations approved)

```sql
begin;
select public.publish_module_version(
  '<module-version-uuid>',
  '<operator-account-uuid>',
  'Language, construct, bias, pilot gates recorded; evidence tier remains provisional.'
);
commit;
```

Keep public evidence tier honest until psychometrics (#43). `guardedBeta` may remain until product retires the beta label.

## Sign-off log (fill when humans finish)

| Module                  | Language | Construct | Bias | Pilot | Publisher | Date | Notes |
| ----------------------- | -------- | --------- | ---- | ----- | --------- | ---- | ----- |
| three_center            |          |           |      |       |           |      |       |
| instinct                |          |           |      |       |           |      |       |
| riasec                  |          |           |      |       |           |      |       |
| attachment              |          |           |      |       |           |      |       |
| socionics_communication |          |           |      |       |           |      |       |
| psychosophy             |          |           |      |       |           |      |       |

Store completed sheets outside git if they contain PII; in-repo only aggregate counts + event IDs from `content_publication_events`.

## Done when

- Reviewer sign-off recorded
- Draft counts drop via real transitions (not SQL force)
- Publication events audited
- Issue #41 closed only with that evidence

## Explicit ban

- `UPDATE questions SET review_status = 'approved'`
- Claiming formal psychometric validation from language review alone
- Publishing Full Spectrum (#42) as a side effect of this review

## Hobby outcome if no reviewers

Leave modules selectable under **guardedBeta** + draft items. Product remains honest. Residual stays open or becomes explicit **wontfix-until-reviewers**.

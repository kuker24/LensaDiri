# Project Handoff

> Refreshed 2026-07-26 after Complex + provisional precision production activation and `/api/modules` deep overlay fix (#38).

## Current objective

Close remaining external gates only. Do **not** fake formal item approval, psychometrics, WCAG cert, or Full Spectrum over-cap publish. Resend still needs operator credentials (never paste secrets in chat).

Do not: reapply migrations through `202607290001`, enable `FEATURE_AI_NARRATIVE`, set Resend secrets without operator possession, force `full_spectrum` published, or claim formal review/psychometrics done.

## Current git state

- Production base: `main` @ `f501630 fix(api): gate deep mode selectability on FEATURE_COMPLEX_MODE (#38)`.
- Prior: #37 release-closure docs, #36 admin read-only, #35 Resend code (dormant delivery).

## Production state (verified 2026-07-26)

| Item                                 | State                                                          |
| ------------------------------------ | -------------------------------------------------------------- |
| URL                                  | `https://lensadiri.vercel.app`                                 |
| Migrations                           | Local==Remote through `202607290001`                           |
| `FEATURE_MODULAR_COMPOSER`           | **ON**                                                         |
| `FEATURE_COMPLEX_MODE`               | **ON** (CAS via `set_feature_flag_state`)                      |
| `FEATURE_PROVISIONAL_PRECISION`      | **ON**                                                         |
| `FEATURE_AI_NARRATIVE`               | **OFF**                                                        |
| Modules                              | 10 selectable; 6 guardedBeta; draft items 147+147 translations |
| Combos public                        | 5: core + 3 pilot/exp + `deep_self_discovery` **pilot**        |
| `full_spectrum`                      | **draft** (over Complex cap; do not publish)                   |
| Recovery email                       | Code live; **no** `RESEND_*` / `EMAIL_FROM` in Vercel          |
| `FEATURE_REQUIRE_EMAIL_VERIFICATION` | unset/OFF                                                      |
| Health                               | `200 ok`                                                       |
| `/api/modules` deep                  | `isSelectable: true` after #38                                 |
| Admin accounts                       | none with admin/super_admin role in DB (empty)                 |

## Rollback (Complex / precision)

```sql
begin;
select public.set_feature_flag_state('FEATURE_COMPLEX_MODE', true, false, null, 'Rollback Complex after activation window.');
select public.set_feature_flag_state('FEATURE_PROVISIONAL_PRECISION', true, false, null, 'Rollback provisional precision.');
-- optional: set deep_self_discovery status back to draft
commit;
```

## Remaining gates

| Gate                                           | Status                                                    |
| ---------------------------------------------- | --------------------------------------------------------- |
| Resend Preview → prod email → mandatory verify | **BLOCKED**: no Resend domain/API key in operator custody |
| Full Spectrum publish                          | **BLOCKED_PRODUCT**: coverage > Complex cap               |
| Formal review 6 modules                        | **BLOCKED_HUMAN**: items stay draft; no fake approved     |
| Psychometrics / WCAG cert / manual SR          | **BLOCKED_EXTERNAL**                                      |
| AI narrative                                   | **DEFERRED** (flag OFF)                                   |

Matrix: `docs/deployment/RELEASE_CLOSURE_GATES.md`.

## Resume rules

- No secrets in chat/files/history.
- Disposable local DB only for destructive tests.
- Canonical PRD v2.0; honest scientific language.

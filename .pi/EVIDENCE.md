# Engineering Evidence

> Refreshed 2026-07-26 after Complex activation + #38.

## Checkpoint

- `main` @ `f501630` (#38 modules deep overlay).
- Prior docs freeze `11661c9` (#37).

## Production activation evidence (2026-07-26)

### Direct DB postcheck (linked `supabase db query --linked`, read-only then approved writes)

| Check                                               | Result                                                        |
| --------------------------------------------------- | ------------------------------------------------------------- |
| Migration list Local==Remote through `202607290001` | MATCH                                                         |
| Flags pre-activation                                | composer true; complex/precision/AI false                     |
| Flags post-activation                               | composer true; **complex true**; **precision true**; AI false |
| Modules selectable                                  | 10                                                            |
| guardedBeta=true versions                           | exactly 6 deferred lenses                                     |
| Draft questions (six modules)                       | 147 (21+18+36+32+16+24)                                       |
| Draft translations (six modules)                    | 147 (same per-module)                                         |
| Total draft rows                                    | 294                                                           |
| Combos                                              | deep_self_discovery **pilot**; full_spectrum **draft**        |
| Admin/super_admin accounts                          | 0 rows                                                        |

### Writes (product approval “Approve all”)

1. `set_feature_flag_state('FEATURE_COMPLEX_MODE', false, true, null, …)`
2. `set_feature_flag_state('FEATURE_PROVISIONAL_PRECISION', false, true, null, …)`
3. `combo_presets.deep_self_discovery` status `draft` → `pilot` + publication event (not formal `published`; required module versions still pilot)

### HTTP smoke post-#38 deploy

| Endpoint                   | Result                                                            |
| -------------------------- | ----------------------------------------------------------------- |
| `GET /api/health`          | `200` `{"status":"ok"}`                                           |
| `GET /api/modules` modes   | quick/standard/deep **all selectable**; precision bands present   |
| `GET /api/modules` modules | 10                                                                |
| `GET /api/combos`          | 5 presets including `deep_self_discovery` pilot; no full_spectrum |

### Code fix #38

`/api/modules` previously ignored `FEATURE_COMPLEX_MODE` and returned seed `deep.is_selectable=false`. Now overlays deep selectability from the flag (parity with estimate/start). CI Quality + Database/browser PASS; Vercel production Ready.

## Explicit non-runs

- Resend Preview/prod: **no** `RESEND_API_KEY` / `EMAIL_FROM` in Vercel env list.
- Mandatory verification: flag not set.
- Full Spectrum publish: capacity gate + experimental modules.
- Formal item transitions to approved: not run (would fake review).
- Psychometric studies / manual NVDA: external.
- AI narrative: left OFF.

## Prior evidence (still valid)

- Staging restore drill 2026-07-23 (torn down): see older sections in git history / ops runbook.
- Retention + audit 365d + observability monitors: prior PRs #28–#34.
- Canonical seed SHA-256: `45275f2a39fc284e8cb716c4b7c84b332fbcc3d150ce0fa83a0b040ec6739212`.

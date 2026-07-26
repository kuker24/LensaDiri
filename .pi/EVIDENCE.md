# Engineering Evidence

> Final audit 2026-07-26 · `main` @ `e8186df`.

## Checkpoint

- `main` @ `e8186df` (#39 activation evidence docs).
- Code path: #38 deep overlay `f501630`; admin #36; recovery code #35; retention/audit #28–#34.

## Release-ready audit (2026-07-26)

| Claim                                   | Result                                            |
| --------------------------------------- | ------------------------------------------------- |
| Hobby modular engineering release-ready | **YES** (~90%)                                    |
| Full PRD v2.0 completion                | **NO** (~72% weighted; see RELEASE_CLOSURE_GATES) |
| 100% complete                           | **NO**                                            |

### Live HTTP smoke (post-#39 merge)

| Endpoint                   | Result                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`          | `200` `{"status":"ok"}`                                                                                                         |
| `GET /api/modules` modes   | quick/standard/deep all `isSelectable: true`                                                                                    |
| `GET /api/modules` modules | 10 keys (trait_profile … psychosophy)                                                                                           |
| `GET /api/combos`          | 5: core_personality published; motivation/career pilot; communication experimental; deep_self_discovery pilot; no full_spectrum |

### Linked infrastructure

| Check                              | Result                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase migration list --linked` | Local==Remote through `202607290001`                                                                                                                        |
| Vercel Production env names        | CRON_SECRET, RATE_LIMIT_SECRET, TOKEN_HASH_PEPPER, CSRF_SECRET, AUTH_SESSION_SECRET, DATABASE_URL, NEXT_PUBLIC_APP_URL — **no** RESEND_API_KEY / EMAIL_FROM |
| Open residual issues               | #40–#45 created this audit                                                                                                                                  |
| Stale open epics                   | none (#2/#4/#5 already closed)                                                                                                                              |

## Production activation evidence (2026-07-26)

### Direct DB postcheck (linked, then approved writes)

| Check                         | Result                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| Flags post-activation         | composer true; **complex true**; **precision true**; AI false |
| Modules selectable            | 10                                                            |
| guardedBeta=true versions     | exactly 6                                                     |
| Draft questions (six modules) | 147                                                           |
| Draft translations            | 147                                                           |
| Combos                        | deep_self_discovery **pilot**; full_spectrum **draft**        |
| Admin/super_admin accounts    | 0                                                             |

### Writes (product approval “Approve all”)

1. `set_feature_flag_state('FEATURE_COMPLEX_MODE', false, true, …)`
2. `set_feature_flag_state('FEATURE_PROVISIONAL_PRECISION', false, true, …)`
3. `deep_self_discovery` draft → **pilot** + publication event (not formal `published`)

### Code fix #38

`/api/modules` overlays deep `isSelectable` from `FEATURE_COMPLEX_MODE`. CI Quality + Database/browser PASS.

## Explicit non-runs / non-claims

- Resend Preview/prod: no secrets in Vercel → tracked **#40**
- Formal item → approved: not run → **#41**
- Full Spectrum publish: capacity → **#42**
- Psychometrics / manual NVDA cert → **#43** / **#44**
- AI narrative: left OFF → **#45**

## Prior evidence (still valid)

- Staging restore drill 2026-07-23 (torn down).
- Retention + audit 365d + observability monitors: #28–#34.
- Canonical seed SHA-256: `45275f2a39fc284e8cb716c4b7c84b332fbcc3d150ce0fa83a0b040ec6739212`.

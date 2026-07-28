# Engineering Evidence

> **Final hobby release baseline:** `main` @ **`c535a6b`** | tag **`v1.0.0-hobby-final`** | 2026-07-26
> **Design2 implementation:** `982067b` | polish pin `9e638ec` | 2026-07-27
> **Dashboard/auth reliability closure:** `main` @ **`3ce060a`** | PR #65 | 2026-07-28
> Status: **MAINTENANCE ONLY** | backend/domain frozen

## Release pin

| Check                          | Result                                     |
| ------------------------------ | ------------------------------------------ |
| Current production SHA         | `3ce060a015b331d2799861d7a466b5663bd4af86` |
| Design2 polish SHA             | `9e638ec9a2fa6b77de63e34c8bef9d5eb4cc80f7` |
| Design2 base SHA               | `982067b33f841b1a5b2c0bd79ce46eaba10a7a20` |
| Baseline tag                   | `v1.0.0-hobby-final` @ `c535a6b`           |
| Product freeze baseline        | `ab2fcdc` (docs pin #51 on top)            |
| Eng baseline tag               | `v0.9.0-hobby-modular`                     |
| Hobby modular engineering      | **100% closed**                            |
| Hobby project finalization     | **100% complete**                          |
| Full PRD product               | **~75%** - stops here honestly             |
| Mode                           | **MAINTENANCE ONLY**                       |
| Frontend redesign              | **COMPLETE** + motion polish live          |
| Dashboard/auth reliability     | **COMPLETE** @ `3ce060a`                   |
| `GET /api/health`              | `200` `{"status":"ok"}`                    |
| `npm audit --audit-level=high` | **0**                                      |
| Tree at polish deploy          | clean / = origin/main at `9e638ec`         |
| Smoke readonly                 | PASS (10/10 public paths)                  |
| Modes                          | quick/standard/deep selectable             |
| Modules                        | 10                                         |
| Combos                         | 5 (deep pilot; full_spectrum draft)        |
| Migrations                     | Local==Remote through `202607290001`       |
| AI                             | **OFF**                                    |
| Resend production secrets      | absent (delivery dormant)                  |
| Open residual                  | #40 #41 #43 #44 external/optional only     |
| Closed residual                | #42 DECIDED / #45 DEFERRED_OFF             |

## Dashboard/Auth Reliability Evidence

| Check                         | Result                                                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge                         | PR [#65](https://github.com/kuker24/LensaDiri/pull/65), `CLEAN`, squash-merged as `3ce060a015b331d2799861d7a466b5663bd4af86`                                                                                                          |
| Scope                         | 15 dashboard/auth reliability source and test files; no DB, migration, env, feature flag, scoring, or new feature                                                                                                                     |
| PR CI                         | [30369143103](https://github.com/kuker24/LensaDiri/actions/runs/30369143103) - **PASS**                                                                                                                                               |
| Quality/build/audit           | Format, lint, typecheck, 176 unit tests, production build, whitespace, dependency audit - **PASS**; audit result **0 vulnerabilities**                                                                                                |
| DB/browser gate               | Disposable Supabase reset, seed replay/drift, integration, pgTAP, Playwright desktop + Pixel 5, accessibility - **PASS**                                                                                                              |
| Post-merge `main` CI          | [30370036507](https://github.com/kuker24/LensaDiri/actions/runs/30370036507) - full gate repeated, **PASS**                                                                                                                           |
| Vercel                        | Preview **PASS**; production deployment for `3ce060a` **SUCCESS**                                                                                                                                                                     |
| Production navigation         | [Manual post-deploy evidence](https://github.com/kuker24/LensaDiri/pull/65#issuecomment-5106109050): desktop login → dashboard → home → dashboard → reload; expected heading remained visible, no recovery state or logout - **PASS** |
| Production test-account erase | [Manual post-deploy evidence](https://github.com/kuker24/LensaDiri/pull/65#issuecomment-5106109050): hard-delete completed; redirect confirmed at `/?account=deleted`; no throwaway account retained                                  |
| Production liveness           | [30371184573](https://github.com/kuker24/LensaDiri/actions/runs/30371184573) on `3ce060a` - **PASS**                                                                                                                                  |
| Production health             | `GET https://lensadiri.vercel.app/api/health` - HTTP **200**, `{"status":"ok"}`                                                                                                                                                       |

## Verdict (binding)

- Hobby modular engineering: **done 100%**
- Final hobby release + archive: **done 100%**
- Product freeze reopened for frontend UI/UX only; backend/domain remains frozen
- Approved Design2 frontend redesign: **complete and live**
- Dashboard/auth reliability fix: **complete in `main@3ce060a`**
- Operating mode: **maintenance only**; no standing feature or redesign queue
- Full PRD product: **not 100%** (~75%); residual is operator/human/external, **not eng blockers**
- No clinical, psychometric validation, or WCAG third-party cert claims
- No large features, paid residual services, AI ON, or unreviewed publish

## Production posture (stable)

| Item                           | State                          |
| ------------------------------ | ------------------------------ |
| Composer / Complex / precision | ON                             |
| AI narrative                   | OFF                            |
| guardedBeta versions           | 6                              |
| Draft Q+T six modules          | 147+147                        |
| deep_self_discovery            | pilot                          |
| full_spectrum                  | draft (multi-session decision) |

## Artifacts

- `.pi/HANDOFF.md`
- `.pi/FRONTEND_REDESIGN_PROGRESS.md`
- `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`
- `docs/deployment/RELEASE_CLOSURE_GATES.md`
- `docs/deployment/RELEASE_ROLLBACK.md`
- `CHANGELOG.md`
- GitHub release: `v1.0.0-hobby-final`

## Design2 Verification

| Check                       | Result                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Local format/lint/typecheck | PASS                                                                                                                       |
| Unit tests                  | 170 PASS                                                                                                                   |
| Production build            | PASS                                                                                                                       |
| Dependency audit            | 0 vulnerabilities                                                                                                          |
| Responsive visual QA        | PASS on desktop and 393px mobile                                                                                           |
| Vercel deployment `9e638ec` | SUCCESS (Production deployment id `5615738055`)                                                                            |
| Production readonly smoke   | 10/10 PASS (`/api/health`, `/`, `/modules`, `/combos`, `/start`, `/privacy`, `/terms`, `/disclaimer`, `/login`, `/method`) |
| Production health           | HTTP 200 `{"status":"ok"}`                                                                                                 |
| Design2 media               | HTTP 200 hero ambient video                                                                                                |
| Landing copy                | Contains `Kenali pola dirimu`                                                                                              |
| CI run                      | https://github.com/kuker24/LensaDiri/actions/runs/30229072056 — **success**                                                |
| CI Quality and build        | PASS                                                                                                                       |
| CI Database and browser     | PASS (integration, pgTAP, seed, Playwright desktop + mobile, accessibility)                                                |

Detailed chronology and evidence: `.pi/FRONTEND_REDESIGN_PROGRESS.md`.

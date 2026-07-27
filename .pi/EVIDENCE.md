# Engineering Evidence

> **Final hobby release baseline:** `main` @ **`c535a6b`** | tag **`v1.0.0-hobby-final`** | 2026-07-26
> **Design2 implementation:** `982067b` | production live 2026-07-27
> Status: **DESIGN2 LIVE / FRONTEND MAINTENANCE** | backend/domain frozen

## Release pin

| Check                          | Result                                     |
| ------------------------------ | ------------------------------------------ |
| Production implementation SHA  | `982067b33f841b1a5b2c0bd79ce46eaba10a7a20` |
| Baseline tag                   | `v1.0.0-hobby-final` @ `c535a6b`           |
| Product freeze baseline        | `ab2fcdc` (docs pin #51 on top)            |
| Eng baseline tag               | `v0.9.0-hobby-modular`                     |
| Hobby modular engineering      | **100% closed**                            |
| Hobby project finalization     | **100% complete**                          |
| Full PRD product               | **~75%** - stops here honestly             |
| Mode                           | **DESIGN2 LIVE / FRONTEND MAINTENANCE**    |
| Frontend redesign              | **COMPLETE** - production live             |
| `GET /api/health`              | `200` `{"status":"ok"}`                    |
| `npm audit --audit-level=high` | **0**                                      |
| Tree at implementation deploy  | clean / = origin/main at `982067b`         |
| Smoke readonly                 | PASS                                       |
| Modes                          | quick/standard/deep selectable             |
| Modules                        | 10                                         |
| Combos                         | 5 (deep pilot; full_spectrum draft)        |
| Migrations                     | Local==Remote through `202607290001`       |
| AI                             | **OFF**                                    |
| Resend production secrets      | absent (delivery dormant)                  |
| Open residual                  | #40 #41 #43 #44 external/optional only     |
| Closed residual                | #42 DECIDED / #45 DEFERRED_OFF             |

## Verdict (binding)

- Hobby modular engineering: **done 100%**
- Final hobby release + archive: **done 100%**
- Product freeze reopened for frontend UI/UX only; backend/domain remains frozen
- Approved Design2 frontend redesign: **complete and live**
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

| Check                        | Result                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Local format/lint/typecheck  | PASS                                                                                                        |
| Unit tests                   | 170 PASS                                                                                                    |
| Production build             | PASS                                                                                                        |
| Dependency audit             | 0 vulnerabilities                                                                                           |
| Responsive visual QA         | PASS on desktop and 393px mobile                                                                            |
| Vercel deployment `982067b`  | SUCCESS                                                                                                     |
| Production readonly smoke    | 8/8 PASS                                                                                                    |
| Production health            | HTTP 200                                                                                                    |
| Design2 media                | HTTP 200 `video/mp4`                                                                                        |
| CI Quality and build         | PASS                                                                                                        |
| CI DB/seed/integration/pgTAP | PASS before browser step                                                                                    |
| CI browser follow-up         | Stale Design1 color/opacity, localized-label, and stacked-heading assertions corrected in current follow-up |

Detailed chronology and evidence: `.pi/FRONTEND_REDESIGN_PROGRESS.md`.

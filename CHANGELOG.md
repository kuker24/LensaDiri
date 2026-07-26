# Changelog

All notable releases of LensaDiri. Dates are UTC calendar days of the release tag.

Honest scope: entries mark **engineering / product** posture. Nothing here claims clinical diagnosis, psychometric validation, or third-party WCAG certification.

## Unreleased (maintenance)

Post-`v0.9.0-hobby-modular` only: security patches, deps, monitoring, retention, health, regression tests, backup readiness, residual #40–#45. No large features. Small PR + CI green + rollback.

### Maintenance cycle 1 (2026-07-26)

- **Audit:** `npm audit` 0 vulns; format/lint/typecheck/unit PASS (157); build PASS; prod health/smoke PASS; liveness + retention monitors recent success.
- **Patch:** `next` + `eslint-config-next` **16.2.11 → 16.2.12** (patch).
- **Patch:** `scripts/monitor-health.mjs` default timeout **10s → 25s** (Hobby cold-start; align retention monitor). Rollback: revert commit / redeploy prior SHA.
- **Triage #40–#45:** still open; no fake close. Backup/PITR remains BLOCKED_EXTERNAL.
- **Skipped:** major dep majors (eslint 10, TS 7, jsdom 29), AI, Full Spectrum, formal review.

## [v0.9.0-hobby-modular] — 2026-07-26

**Tag:** `v0.9.0-hobby-modular` @ `1e59de4` (docs closure; eng baseline from prior merges)
**URL:** https://lensadiri.vercel.app
**Lens:** Hobby modular **engineering** release-ready (**100% of that lens**). Full PRD product completion still open (~72% weighted). **Not** full-product 100%.
**Mode after tag:** **MAINTENANCE**.

### Production posture

| Flag / surface                  | State                                      |
| ------------------------------- | ------------------------------------------ |
| `FEATURE_MODULAR_COMPOSER`      | ON                                         |
| `FEATURE_COMPLEX_MODE`          | ON                                         |
| `FEATURE_PROVISIONAL_PRECISION` | ON                                         |
| `FEATURE_AI_NARRATIVE`          | OFF                                        |
| Migrations                      | Local==Remote through `202607290001`       |
| Modules                         | 10 selectable (6 guardedBeta; items draft) |
| Combos public                   | 5 including `deep_self_discovery` pilot    |
| `full_spectrum`                 | draft (over Complex cap)                   |
| Recovery email delivery         | dormant (code present; no Resend secrets)  |
| Health                          | `200` `{"status":"ok"}`                    |

### Included (engineering)

- Legacy Quick 40 / Standard 60 + modular composer and independent scoring engines
- Complex mode + provisional precision bands; deep mode selectable (#38)
- Deep preset pilot; five public combos
- Auth (Argon2id, HttpOnly session, CSRF, rate limit), private results, share allowlist
- Admin read-only DB-backed (#36)
- Retention cleanup + audit security events 365d (#28–#34)
- Recovery transport **code** + optional verify gate (#35); delivery off without secrets
- Observability: health monitor, structured ops events, staging restore drill evidence
- CI: format, lint, typecheck, unit, build, audit, integration, pgTAP, seed replay, e2e

### Explicitly not in this release

| Residual                                                   | Tracking |
| ---------------------------------------------------------- | -------- |
| Live Resend Preview→prod email + optional mandatory verify | #40      |
| Formal human review of 6 guarded module item banks         | #41      |
| Full Spectrum redesign / publish under capacity            | #42      |
| Psychometric validation program                            | #43      |
| Manual screen-reader pass + WCAG third-party cert          | #44      |
| AI narrative (consent, provider, fallback)                 | #45      |

### Non-claims

- Not a clinical or diagnostic instrument
- Not psychometrically validated (reliability / factor / norming not done)
- Not WCAG certified by a third party
- Email recovery not delivered until operator sets secrets
- Six guarded modules remain draft review + `guardedBeta`

### Rollback

See `docs/deployment/RELEASE_ROLLBACK.md`.

### Evidence

- `.pi/EVIDENCE.md`, `.pi/HANDOFF.md`
- `docs/deployment/RELEASE_CLOSURE_GATES.md`

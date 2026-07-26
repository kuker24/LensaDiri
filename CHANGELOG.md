# Changelog

All notable releases of LensaDiri. Dates are UTC calendar days of the release tag.

Honest scope: entries mark **engineering / product** posture. Nothing here claims clinical diagnosis, psychometric validation, or third-party WCAG certification.

## Unreleased (reactive maintenance only)

**Status:** **ARCHIVED / MAINTENANCE** after **`v1.0.0-hobby-final`**. Standing watch **CLOSED**. React only on CVE · critical dep · health fail · monitor alert · retention · backup risk · regression. No large features, paid residual services, AI ON, WCAG/psychometric cert claims, or unreviewed publish.

## [v1.0.0-hobby-final] — 2026-07-26

**Tag:** `v1.0.0-hobby-final` @ **`c535a6b`**  
**URL:** https://lensadiri.vercel.app  
**Hobby engineering + project finalization:** **100%**. Full PRD product: **stops ~75%** (honest).  
**Mode:** **ARCHIVED / MAINTENANCE**. Standing watch **CLOSED**.

### Release verification (at tag)

- SHA `c535a6b` · tree clean · = origin/main
- `GET /api/health` → **200** `{"status":"ok"}`
- `npm audit --audit-level=high` → **0**
- Residual **#40 #41 #43 #44** = external optional, **not blockers**
- Residual closed: **#42** DECIDED · **#45** DEFERRED_OFF

### What this tag is

- Final hobby product freeze docs pin (#51) on engineering freeze `ab2fcdc`
- Eng baseline tag: `v0.9.0-hobby-modular`
- Archive declaration: no continuous standing-watch queue
- Index: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md` · handoff: `.pi/HANDOFF.md`

### Final hobby freeze baseline (2026-07-26)

- Product freeze pin: **`ab2fcdc`** · residual docs #50 · freeze docs #51 → `c535a6b`
- Residual open (external/optional, not blockers): **#40** Resend · **#41** human review · **#43** psychometrics · **#44** manual a11y

### Residual hobby close (2026-07-26)

Free/hobby max without paid services or fake certs. Index: `docs/deployment/RESIDUAL_HOBBY_CLOSE.md`. Full PRD product **~75%** weighted (eng lens still 100%).

| #   | Outcome                                                                              | Doc                                               |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 40  | Free-tier Resend activation runbook; delivery still dormant without operator secrets | `docs/operations/RESEND_FREE_TIER_ACTIVATION.md`  |
| 41  | Human review packet for 6 guarded modules; no bulk-approve                           | `docs/operations/GUARDED_MODULE_REVIEW_PACKET.md` |
| 42  | **DECIDED:** keep `full_spectrum` draft; multi-session path under Complex 120        | `docs/product/FULL_SPECTRUM_CAPACITY_DECISION.md` |
| 43  | Psychometric prep only; not validated                                                | `docs/science/PSYCHOMETRIC_VALIDATION_PREP.md`    |
| 44  | Manual a11y checklist; no WCAG self-cert                                             | `docs/qa/MANUAL_A11Y_CHECKLIST.md`                |
| 45  | AI narrative **OFF** free-tier stance                                                | `docs/product/AI_NARRATIVE_FREE_TIER_STANCE.md`   |

- **Skipped:** buying email/LLM/auditor; publishing Full Spectrum over cap; fake item `approved`; enabling AI.

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

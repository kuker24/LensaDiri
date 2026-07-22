# Engineering Evidence

> Refreshed 2026-07-22 (post PR #24 squash-merge). Supersedes stale 64-test / `phase-1-foundation` checkpoint.

## Objective

Reproducible checkpoint for LensaDiri: legacy compatibility, modular composer live in production, 10-lens engineering complete and local-verified, guarded 6-lens release candidate pending approval.

## Source checkpoint

- Active branch: `main`, HEAD `47b8303 Fix assessment answer persistence race (#24)`, origin-synced.
- PR #24 squash-merged 2026-07-22: answer-persistence race fix + `sharp ^0.35.3` override (clears libvips CVE-2026-33327/33328/35590/35591). Both CI jobs green on merged SHA.
- All-lenses branch: `agent/complete-all-lenses-release-ready` (from `origin/main` `38c982f`); not yet merged.
- Production URL: `https://lensadiri.vercel.app`.
- Merged history through PR #24. Prior PR #3 snapshot obsolete.

Production identifiers, database URLs, tokens, passwords, keys, and secrets are intentionally excluded.

## Production state

- Modular schema + quality-model + guarded all-lenses rollout applied through migration `202607270001`.
- `FEATURE_MODULAR_COMPOSER` ON; `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, `FEATURE_AI_NARRATIVE` OFF (per last checkpoint; flag table not re-queried this read-only audit).
- 10 canonical modules present, all selectable in production, honest tiers (active/published/pilot/experimental).
- Migration `202607270001_guarded_all_lenses_release.sql` applied to production (linked migration list shows it on Local+Remote, 2026-07-22); all 10 modules selectable, confirmed via public `/modules/<key>` CTAs and `/combos` presets.

## Verification evidence (all-lenses branch, disposable local Supabase)

| Gate                             | Result                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`           | PASS                                                                                                                   |
| `npm run lint`                   | PASS                                                                                                                   |
| `npm run typecheck`              | PASS                                                                                                                   |
| `npm test`                       | PASS: 23 files, 111 tests                                                                                              |
| `npm run build`                  | PASS with dummy test-only environment                                                                                  |
| `npm audit --audit-level=high`   | PASS: zero vulnerabilities                                                                                             |
| `npm run db:reset`               | PASS against disposable local Supabase                                                                                 |
| `npm run test:seed-replay`       | PASS: modules 10, module_versions 11, dimensions 49, questions/translations/mappings 405, presets 6, combo_mappings 27 |
| Canonical seed SHA-256           | `45275f2a39fc284e8cb716c4b7c84b332fbcc3d150ce0fa83a0b040ec6739212`                                                     |
| `npm run test:seed-replay-drift` | PASS: drift rejected and restored                                                                                      |
| `npm run test:integration`       | PASS: 8 files, 32 tests                                                                                                |
| `npm run test:db`                | PASS: 236 assertions, 4 files                                                                                          |
| `npm run test:e2e`               | PASS: 58 tests, desktop Chromium + Pixel 5 (flags ON on disposable local only)                                         |
| Accessibility subset             | PASS: 42 checks within full Playwright suite                                                                           |
| GitHub Actions (PR #24 SHA)      | PASS: `Quality and build` + `Database and browser tests` green; PR squash-merged to `main` `47b8303`                   |
| Post-merge `main` gates          | PASS: format, lint, typecheck, unit 28/134, build, `npm audit` 0 vulns, `git diff --check` clean                       |

E2E/a11y modular runs enable `FEATURE_MODULAR_COMPOSER` and `FEATURE_COMPLEX_MODE` on disposable DB only, matching CI. No production flag change.

## Security posture

- Database, repository, service, scoring, transport remain server-only.
- Cookie-auth mutations: exact same-origin CSRF + rate limit across mutation routes.
- Password Argon2id; session/assessment/result/share/recovery tokens HMAC-hashed at rest.
- Recovery tokens single-use, expiry, generic response, session revoke, concurrent-safe.
- Sensitive tables forced RLS, zero browser policy, zero direct `anon`/`authenticated` privilege (pgTAP).
- Public shared result allowlist explicit; private quality/confidence/clarifier/timing stay private.
- IP/user-agent stored as HMAC fingerprint only; no server `console.*`, no raw answer logging.
- Modular/Complex UI+API fail closed while flags OFF.

## Residual risks and deferred scope

- Migration `202607270001` already applied to production; a read-only content-table postcheck (selectability, `pilot`/`experimental` status, `draft` items/translations, `guardedBeta` scope) is still recommended and was not run in this audit.
- Provider email delivery + mandatory verification `BLOCKED_EXTERNAL`.
- AI narrative, formal psychometric validation, third-party WCAG certification, monitoring provider, restore drill, isolated staging, custom domain, retention automation remain deferred or partial.
- `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, `FEATURE_AI_NARRATIVE` OFF in production.
- Never run local reset, integration, pgTAP, seed, or E2E suites against production.

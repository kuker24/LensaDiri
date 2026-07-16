# Project Handoff

## Current objective

Finish and push a safe modular release candidate on `agent/phase-1-foundation` without touching production. Authorized remote scope ends at explicit commits, branch push, and GitHub Actions observation.

Do not merge PR #3, run hosted dry-run, backup/export production data, migrate/seed/deploy production, change Vercel environment or alias, activate feature flags, or expose secrets.

## Current state

- Baseline production remains legacy Quick 40/Standard 60.
- Local modular candidate includes immutable composer provenance, independent scoring, Full Spectrum/Complex/clarifier/dashboard flows, safe DTO projections, migration evidence, and default-off rollout gates.
- Account-recovery foundation is locally complete but dormant for production. Email provider delivery and mandatory verification remain blocked external.
- Working tree contains candidate source/test/docs changes that must be staged by explicit paths.
- GitHub Actions remains pending until commits are pushed.

## Completed in current candidate

- Fixed recovery delivery/consume constraint mismatch.
- Tokens are delivered before consumption, replaced atomically, single-use, expiry-checked, and concurrent-consume safe.
- Password reset revokes active sessions. Unknown-account requests remain generic.
- Added recovery pgTAP constraints and integration lifecycle coverage.
- Moved recovery bearer links from query parameters to URL fragments.
- Added feature-flag guards to modular page/catalog/combo/estimate surfaces. Full Spectrum is hidden while Complex is off.
- Added CSRF protection to estimate mutation.
- Added scoring-registry compatibility filtering for catalog and published preset pins.
- Removed impossible low-capacity clarifier recommendations.
- Added Indonesian private-result labels and progressbar accessibility semantics.
- Added E2E synchronization for clarifier/dashboard autosave and isolated disposable-test rate limits.
- Expanded production migration map with read-only hosted history and all pending migration safety metadata.

## Current verification

- Format, lint, typecheck: PASS.
- Unit: 14 files, 64 tests PASS.
- Build: PASS with dummy test-only environment.
- Dependency audit: zero vulnerabilities.
- Seed replay: PASS with modules 10, versions 13, dimensions 64, questions/translations/mappings 642, presets 6, mappings 25.
- Canonical hash: `c3d01263dc56ad7f6434fe7af99d1e6b934e82182aed2c6c2539d5818a4b69f0`.
- Drift rejection/restoration and upgrade parity: PASS.
- Integration: 8 files, 46 tests PASS.
- pgTAP: 237 assertions PASS.
- Playwright: 22/22 PASS, desktop Chromium and Pixel 5.
- Three final clean-reset loops: PASS with the same counts and hash.
- Production actions: SKIPPED.

## Remaining steps

1. Format changed documentation and rerun `git diff --check`.
2. Review full diff for secrets, artifacts, unrelated files, and stale claims.
3. Stage explicit logical slices. Never use `git add -A`.
4. Commit source/test foundation and release evidence separately.
5. Push only `agent/phase-1-foundation`.
6. Require both GitHub jobs PASS on pushed SHA:
   - `Quality and build`
   - `Database and browser tests`
7. If CI fails, fix-forward locally, rerun affected and full gates, commit, and push.
8. Stop after CI evidence. No merge or production action.

## Release blockers after push

- GitHub Actions must be green.
- Hosted dry-run and production migration need separate approval.
- Backup/restore capability or accepted hobby-platform limitation needs operator decision.
- Provider email and mandatory verification need provider/product approval.
- Feature activation needs separate product/release approval.
- Formal psychometric validation and third-party accessibility certification remain deferred. Do not claim either.

## Resume rules

- Work in repository root, not parent workspace.
- Preserve user changes. Do not reset, clean, stash, or checkout over them.
- Do not read `.env` or print credentials.
- Use disposable local Supabase for reset, integration, pgTAP, seed, and E2E.
- Preserve legacy readers and feature flags default OFF.
- Use `docs/product/PRD_FULL_LensaDiri.md` as canonical contract and current QA docs as implementation evidence.

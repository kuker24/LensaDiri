# Documentation Agent Guide

## Purpose

`docs/` holds product requirements, architecture decisions, security contracts, QA evidence, and optional AI tooling guidance for LensaDiri.

## Ownership

- `product/PRD_FULL_LensaDiri.md`: canonical PRD 2.0 product and engineering contract; separates current MVP production baseline from modular target, migration phases, API/data contracts, acceptance criteria, security, scientific, and UX constraints.
- `architecture/ADR-0001-phase-0-foundation.md`: accepted historical Phase 0 foundation decision.
- `security/PHASE_1_AUTH.md`: Phase 1 trust boundary, schema/RLS/grant, internal auth, session, CSRF, rate-limit, audit, and consent contract.
- `qa/PHASE_1_VERIFICATION.md`: historical Phase 1 checkpoint and Docker recovery steps.
- `qa/MVP_LOCAL_VERIFICATION.md`: current local MVP scope, passing gates, security boundaries, and remaining production risks.
- `deployment/PRODUCTION_VERCEL_SUPABASE.md`: single-project hobby production workflow, environment contract, smoke checks, and rollback limits.
- `deployment/PRODUCTION_MIGRATION_MAP.md`: repository-to-production migration/seed mapping without project identifiers or credentials.
- `ai/MCP_SETUP.md`: optional least-privilege MCP setup. MCP is not application runtime dependency.

## Local Contracts

- Separate implemented MVP baseline from PRD 2.0 modular target. Module catalog, Test Composer, independent module scoring, Normal/Complex/Clarifier, target API, and target schema are not implemented facts until source and verification prove them.
- Preserve PRD 2.0 decisions: modular lens selection, immutable blueprint, independent scoring per module, correlation after primary scoring, backward-compatible migration, and minimal-complete frontend before final visual replacement.
- Preserve accepted ADR history. Correct historical records only through a new ADR or an explicit amendment; do not silently rewrite history.
- Keep scientific language honest: no diagnosis, certainty, proprietary item reuse, unsupported validation claim, or fake social proof.
- Never document credentials, private tokens, raw answers, private result data, raw IPs, or raw user-agent strings.
- Update relevant documentation when behavior, architecture, privacy practice, security contract, commands, setup, or verification state changes.
- Keep historical blocked DB evidence labeled historical. Current local MVP DB gates passed on 2026-07-13; future claims still require rerun after relevant source changes.
- MCP examples may contain placeholders only, must default to local development and least privilege, and must not grant production access or default write access.

## Work Guidance

1. Use PRD as product source of truth, then verify code-state claims against repository evidence.
2. Keep MVP scope separate from V1, V2, and V3 roadmap items.
3. Describe security controls precisely. Do not claim a control exists before code and verification evidence exist.
4. Keep setup and operational instructions command-accurate and safe for local use.
5. Keep database commands aligned with `package.json`, `supabase/config.toml`, migration names, and test setup.
6. Keep AI tooling documentation separate from app runtime configuration. `.mcp.example.json` is a tracked template; local MCP configurations remain ignored.

## Verification

- Run Prettier on changed Markdown or JSON documentation, except canonical `product/PRD_FULL_LensaDiri.md`, which is intentionally listed in `.prettierignore` and maintained manually to preserve stable long-form contract diffs.
- For PRD edits, inspect Markdown structure and `git diff --check`; do not run automatic whole-file formatting.
- Confirm commands, paths, environment names, and routes against current repository files before documenting them.
- Run `git diff --check` after documentation changes.
- Root mandatory gates apply when documentation accompanies code changes.

## Child DOX Index

No child DOX. Existing product, architecture, security, QA, and AI documentation areas are covered here.

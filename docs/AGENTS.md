# Documentation Agent Guide

## Purpose

`docs/` holds product requirements, architecture decisions, security contracts, QA evidence, and optional AI tooling guidance for LensaDiri.

## Ownership

- `product/PRD_FULL_LensaDiri.md`: source product requirements, phase scope, acceptance criteria, security, privacy, scientific, and UX constraints.
- `architecture/ADR-0001-phase-0-foundation.md`: accepted historical Phase 0 foundation decision.
- `security/PHASE_1_AUTH.md`: Phase 1 trust boundary, schema/RLS/grant, internal auth, session, CSRF, rate-limit, audit, and consent contract.
- `qa/PHASE_1_VERIFICATION.md`: exact Phase 1 validation commands, evidence, blocked database gates, and Docker recovery steps.
- `ai/MCP_SETUP.md`: optional least-privilege MCP setup. MCP is not application runtime dependency.

## Local Contracts

- Separate implemented facts from PRD proposals, future phases, and target architecture.
- Preserve accepted ADR history. Correct historical records only through a new ADR or an explicit amendment; do not silently rewrite history.
- Keep scientific language honest: no diagnosis, certainty, proprietary item reuse, unsupported validation claim, or fake social proof.
- Never document credentials, private tokens, raw answers, private result data, raw IPs, or raw user-agent strings.
- Update relevant documentation when behavior, architecture, privacy practice, security contract, commands, setup, or verification state changes.
- State blocked database verification precisely: Docker/local Supabase unavailable in one environment is evidence for that environment, not permanent project behavior or a passing gate.
- MCP examples may contain placeholders only, must default to local development and least privilege, and must not grant production access or default write access.

## Work Guidance

1. Use PRD as product source of truth, then verify code-state claims against repository evidence.
2. Keep MVP scope separate from V1, V2, and V3 roadmap items.
3. Describe security controls precisely. Do not claim a control exists before code and verification evidence exist.
4. Keep setup and operational instructions command-accurate and safe for local use.
5. Keep database commands aligned with `package.json`, `supabase/config.toml`, migration names, and test setup.
6. Keep AI tooling documentation separate from app runtime configuration. `.mcp.example.json` is a tracked template; local MCP configurations remain ignored.

## Verification

- Run Prettier on changed Markdown or JSON documentation.
- Confirm commands, paths, environment names, and routes against current repository files before documenting them.
- Run `git diff --check` after documentation changes.
- Root mandatory gates apply when documentation accompanies code changes.

## Child DOX Index

No child DOX. Existing product, architecture, security, QA, and AI documentation areas are covered here.

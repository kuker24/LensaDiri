# Documentation Agent Guide

## Purpose

`docs/` holds product requirements and architecture decisions for LensaDiri.

## Ownership

- `product/PRD_FULL_LensaDiri.md`: source product requirements, phase scope, acceptance criteria, security, privacy, scientific, and UX constraints.
- `architecture/ADR-0001-phase-0-foundation.md`: accepted historical Phase 0 foundation decision.

## Local Contracts

- Separate implemented facts from PRD proposals, future phases, and target architecture.
- Preserve accepted ADR history. Correct historical records only through a new ADR or an explicit amendment; do not silently rewrite history.
- Keep scientific language honest: no diagnosis, certainty, proprietary item reuse, unsupported validation claim, or fake social proof.
- Never document credentials, private tokens, raw answers, or private result data.
- Update relevant documentation when behavior, architecture, privacy practice, security contract, commands, or setup changes.

## Work Guidance

1. Use PRD as product source of truth, then verify code-state claims against repository evidence.
2. Keep MVP scope separate from V1, V2, and V3 roadmap items.
3. Describe security controls precisely. Do not claim a control exists before code and verification evidence exist.
4. Keep setup and operational instructions command-accurate and safe for local use.

## Verification

- Run `npm run format:check` after Markdown edits.
- Confirm commands and paths against current repository files before documenting them.
- Root mandatory gates apply when documentation accompanies code changes.

## Child DOX Index

No child DOX. Existing product and architecture documents are compact and covered by this contract.

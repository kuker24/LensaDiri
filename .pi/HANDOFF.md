# Project Handoff

> Refreshed 2026-07-26 after admin DB-backed read-only merge (#36) and docs release-closure gates. Supersedes retention-era snapshot at `e5a37d1`.

## Current objective

Drive remaining production-readiness gates with small PRs, green CI, and **separate explicit approval** before any secret, migration, flag flip, or production write.

Do not: reapply or modify production migrations through `202607290001`, activate `FEATURE_COMPLEX_MODE` / `FEATURE_PROVISIONAL_PRECISION` / `FEATURE_AI_NARRATIVE`, set Resend secrets or `FEATURE_REQUIRE_EMAIL_VERIFICATION` without approval, run hosted dry-run/backup/seed/deploy/alias unapproved, change Vercel env, expose secrets, or merge without green CI.

## Current git state

- Production base: `main` / `origin/main` at `3eb53bc feat(admin): DB-backed read-only catalog, feedback, and audit views (#36)`.
- Recent merges: #34 audit retention 365d, #35 Resend recovery transport + optional verify gate, #36 admin DB-backed read-only.
- Open PRs: none at handoff refresh (docs slice may open after this file).
- Epics #2 / #4 / #5 remain OPEN as historical shells; residual gates live here and in `docs/deployment/RELEASE_CLOSURE_GATES.md`.

## Production state

- URL `https://lensadiri.vercel.app`, Supabase hosted Singapore (`lensadiri-production`, ap-southeast-1).
- Migrations applied through `202607290001` (Local==Remote at last linked list; re-dry-run up to date).
- `FEATURE_MODULAR_COMPOSER` = **ON**. `FEATURE_COMPLEX_MODE`, `FEATURE_PROVISIONAL_PRECISION`, `FEATURE_AI_NARRATIVE` = **OFF**.
- 10 modules selectable (4 pilot + 2 experimental guarded). Presets `deep_self_discovery` / `full_spectrum` stay **draft** / hidden.
- Recovery Resend transport + optional login gate: **code live, delivery dormant** (no `RESEND_API_KEY` / `EMAIL_FROM`; `FEATURE_REQUIRE_EMAIL_VERIFICATION` unset/OFF).
- Admin `/admin/*`: DB-backed read-only, fail-closed `requireAdminSession`, DTO allowlist; guest → redirect.
- Legacy Quick 40 / Standard 60 remains baseline-compatible.
- Health smoke post-#36: `GET /api/health` → `200 {"status":"ok"}`; `/admin` guest `307`; retention unauth `401`.

## Module tiers (10 lenses)

| Tier           | Modules                                    |
| -------------- | ------------------------------------------ |
| `active`       | Trait Profile                              |
| `published`    | 16-Type, Enneagram, Temperament            |
| `pilot`        | Three Center, Instinct, RIASEC, Attachment |
| `experimental` | Socionics, Psychosophy                     |

## Completed engineering (not residual product claims)

- Independent scoring engines for all 10 module keys; version-aware registry; fail-closed unknown version.
- Immutable composer/blueprint; Complex lifecycle + clarifier (flag-gated); safe share/export DTO allowlist.
- Recovery foundation + Resend transport + optional verification gate (default OFF).
- Admin read-only DB views (#36); retention cleanup + audit 365d roll-off; observability health monitor + issue routing.
- Isolated staging + restore drill evidence 2026-07-23 (project deleted after drill). Direct hosted `pg_dump`/`pg_restore` still `BLOCKED_EXTERNAL` without local Docker/pg.

## Remaining gates (approval-separated)

Canonical matrix: `docs/deployment/RELEASE_CLOSURE_GATES.md`.

| #   | Gate                         | Status                                    | Owner action                                      |
| --- | ---------------------------- | ----------------------------------------- | ------------------------------------------------- |
| 1   | Resend Preview drill         | CODE_READY / BLOCKED_EXTERNAL credentials | Domain + Preview secrets + disposable inbox proof |
| 2   | Production email delivery    | NEEDS_APPROVAL_PROD                       | After Preview evidence only                       |
| 3   | Mandatory verification       | CODE_READY / NEEDS_APPROVAL_PROD          | After delivery + legacy comms plan                |
| 4   | Complex mode                 | CODE_READY flag OFF                       | Product approval + `set_feature_flag_state`       |
| 5   | Deep / Full Spectrum presets | PARTIAL (draft)                           | After Complex + publication workflow              |
| 6   | Provisional precision        | CODE_READY flag OFF                       | Product approval                                  |
| 7   | Formal review 6 modules      | NOT_STARTED content                       | Human reviewers + SQL transitions                 |
| 8   | Psychometric validation      | DEFERRED_EXTERNAL                         | Domain study; never fake claims                   |
| 9   | Manual a11y audit            | AUTO PASS / manual BLOCKED                | NVDA/JAWS/VoiceOver + human contrast              |
| 10  | Direct DB postcheck          | SQL pack ready                            | Operator trusted session only                     |
| 11  | Issue/docs cleanup           | IN PROGRESS                               | This slice + epic comments                        |
| 12  | Restore drill final          | PARTIAL                                   | Re-provision staging when needed; PITR external   |
| 13  | Release closure              | NEEDS_APPROVAL_PROD                       | Sign-off per remaining window                     |

## Resume rules

- Work in repository root, not parent workspace.
- Preserve user changes. Do not reset, clean, stash, or checkout over them.
- Do not read `.env` or print credentials.
- Use disposable local Supabase for reset, integration, pgTAP, seed, and E2E.
- Preserve legacy readers; keep production flags at documented state unless approval explicit.
- Canonical contract: `docs/product/PRD_FULL_LensaDiri.md` v2.0.
- Evidence: `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md`, `docs/deployment/MODULAR_RELEASE_READINESS.md`, `docs/deployment/RELEASE_CLOSURE_GATES.md`, this file + `.pi/EVIDENCE.md`.

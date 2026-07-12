# MCP Setup

## Decision

MCP is optional developer tooling. LensaDiri application runtime, build, tests, database migration, and deployment do not depend on MCP. Do not add an MCP server without a task needing it.

This audit finds four useful local-development integrations:

| MCP        | Purpose                                                                            | Default permission                                                                  |
| ---------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| GitHub     | Read issues and pull requests while planning or reviewing work.                    | Read-only token scope; write actions disabled unless explicitly enabled for a task. |
| PostgreSQL | Inspect local Supabase development schema and test data after local Supabase runs. | Local development database only; read-only role.                                    |
| Playwright | Drive local browser tests and inspect UI/accessibility behavior.                   | Local app only.                                                                     |
| Filesystem | Read or edit files inside this repository.                                         | One explicit repository root only.                                                  |

No MCP configuration grants production access or write access by default.

## Configuration scope

Use global agent configuration only for tools shared across repositories, such as a constrained Playwright launcher. Keep LensaDiri-specific filesystem paths and local development database settings in local repository configuration.

`.mcp.example.json` is a generic tracked template. Copy it to `.mcp.json` only if the chosen MCP host supports this format. Some MCP hosts use a different configuration file or environment interpolation syntax; translate field names and `${...}` placeholders according to that host documentation. Do not commit local configuration, token files, or exported environment files.

```bash
cp .mcp.example.json .mcp.json
```

Replace `<ABSOLUTE_PATH_TO_LENSADIRI_REPOSITORY>` locally. Export `MCP_GITHUB_TOKEN` and `MCP_DEV_READONLY_DATABASE_URL` only in the local agent process when optional servers need them. These are MCP-host variables, not LensaDiri application configuration keys; do not add them to `.env.example`.

The commands in the example use commonly available `npx` packages. Before use, verify the package and option surface against the MCP provider documentation for the installed agent host. Preserve disabled optional entries until a concrete task needs them.

## Filesystem MCP

Purpose: repository navigation, focused edits, and local checks where agent host uses MCP filesystem access.

Required boundary:

- Pass exactly one absolute path: LensaDiri repository root.
- Do not mount home directory, parent project directories, `/tmp`, or filesystem root.
- Do not give filesystem tool access to secret stores or `.env` files.
- Keep write access only when an implementation task explicitly requires it; read-only is preferred for review.

Example command in template:

```text
npx -y @modelcontextprotocol/server-filesystem <ABSOLUTE_PATH_TO_LENSADIRI_REPOSITORY>
```

## Playwright MCP

Purpose: test local routes, keyboard behavior, mobile viewport behavior, and browser-visible auth flow after that UI exists.

Boundary:

- Use local development server or local preview only.
- Do not persist authenticated production profiles, downloads containing private results, or browser state with session cookies.
- Run Playwright MCP only after app server starts locally; existing `npm run test:e2e` remains project browser-test gate.

Example command in template:

```text
npx -y @playwright/mcp@latest
```

## GitHub MCP

Purpose: read issue context, pull-request discussion, and CI state. It can aid release workflow only when GitHub data is necessary.

Boundary:

- Start with fine-grained read-only repository permissions for issues, pull requests, and checks.
- Do not give organization-wide, administration, workflow-write, or production-secret scopes.
- Keep template entry disabled. Enable only for a concrete GitHub task and only after setting local `MCP_GITHUB_TOKEN`.
- Write operations such as issue comments, PR changes, labels, or merge actions need explicit task approval and least additional scope. Do not expose token in JSON, docs, terminal logs, or repository files.

Template uses a generic environment placeholder:

```text
GITHUB_PERSONAL_ACCESS_TOKEN=${MCP_GITHUB_TOKEN}
```

## PostgreSQL MCP

Purpose: inspect schema, migration state, RLS metadata, and disposable development test records after Supabase local environment is healthy.

Boundary:

- First install Docker, run `npm run db:start`, then `npm run db:reset`.
- Use a dedicated local read-only database role if PostgreSQL MCP can enforce it. Otherwise do not enable this MCP for routine inspection; use project migration/test commands instead.
- Set `MCP_DEV_READONLY_DATABASE_URL` only to a dedicated local read-only development role. Never provide production, staging, shared developer, or service-role connection URL.
- Keep template entry disabled. Enable only for a task requiring database inspection.
- Do not use MCP to bypass migration review, RLS tests, or application authorization.

Generic template command:

```text
npx -y @modelcontextprotocol/server-postgres ${MCP_DEV_READONLY_DATABASE_URL}
```

## Operational checklist

1. Start with filesystem or Playwright only when needed.
2. Copy template to ignored `.mcp.json`; never edit template with local values.
3. Keep GitHub and PostgreSQL entries disabled by default.
4. Add only temporary, least-privilege environment variables in the agent host.
5. Verify target is local and development-only before enabling PostgreSQL or browser auth state.
6. Remove local config or revoke token after work if no longer needed.

MCP does not replace `npm run db:reset`, `npm run test:integration`, `npm run test:db`, `npm run test:e2e`, code review, or deployment controls.

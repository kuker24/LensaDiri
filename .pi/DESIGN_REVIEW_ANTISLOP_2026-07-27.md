# Design review → MCP → enhance-prompt → impeccable anti-slop (FINAL)

**Date:** 2026-07-27
**Branch:** `design/opendesign-iteration` → merge `main` for production
**Scope:** frontend-only Soft Product final pass (`/` + `/start` + shared motion primitives)

## Skill pipeline (completed)

| Skill                   | Task                                                 | Done                                                                            |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| **browser-act**         | Visual audit before/after on `/`, `/start`, `/login` | Yes — screenshots under `.pi/screenshots/design-review-{before,after}/`         |
| **/inb-design-review**  | Designer-who-codes audit then fix                    | Yes — findings fixed in source                                                  |
| **/frontend-mcp-setup** | Confirm relevant MCP stack                           | Yes — shadcn + Magic UI + Playwright already in `.mcp.json`; no extra fireworks |
| **/inb-enhance-prompt** | Design-spec upgrade brief                            | Yes — `.pi/ENHANCED_DESIGN_PROMPT_2026-07-27.md`                                |
| **/impeccable**         | Dual-agent critique + anti-slop implement            | Yes — score **31/40**, P0/P1 = 0; residual P2/P3 closed in final pass           |

## Implementation (total)

### Motion / anti-slop

- `BlurFade`: opacity always **1** (content-first); blur default **off**
- Removed gradient-text shiny keyframes from `globals.css`
- `AnimatedShinyText`: solid ink API (no `bg-clip-text`)
- Hero label: solid mono, not shiny gradient

### Home `/`

- ReflectionPass: no numeric fake scores; “contoh” spectrum + illustration disclaimer; no BorderBeam
- Lens rows: no decorative 01–03 indices
- Trust titles: human sans, not mono stamps; no glass blur / no BorderBeam
- Peak-end CTA retained

### Start `/start`

- Single modular recommended path; legacy under `<details>`
- BorderBeam removed from launch card
- Concrete microcopy: satu lensa · bisa tambah · jeda
- Details open affordance: **+ / −** via `group-open`

### Contract

- `DESIGN.md` synced to Plus Jakarta + Soft Product radii + content-first motion

## Verification (pre-merge)

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `detect.mjs` on home/start targets → `[]`
- Live mid-page copy present after full-page capture

## Production deploy path

`vercel.json` deploys **only `main`**. Ship via merge to `main` (PR) then Vercel production.

## Residual deliberately kept

- Soft Product monochrome Spotlight on hero ambient (one restrained light, reduced-motion off)
- `BorderBeam` / `AnimatedShinyText` components retained for inventory but **not** wired on decision surfaces
- Film-strip marketing length is product intentional (portal), not dual-process junk (process only in “Cara melihat”)

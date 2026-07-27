# Soft Product polish evidence — 2026-07-27

## Implemented (plan 1→2→3)

### Components (MCP shortlist, rethemed monochrome)

| Source | Component | Role |
|--------|-----------|------|
| Magic UI | `blur-fade` | Section/mount reveal (`src/components/ui/blur-fade.tsx`) |
| Magic UI | `border-beam` | Frost beam on cards (`border-beam.tsx`) |
| Magic UI | `animated-shiny-text` | Hero micro-label only (`animated-shiny-text.tsx`) |
| Aceternity | `spotlight` | Soft void spotlight in hero (`spotlight.tsx`) |
| Local | `use-prefers-reduced-motion` | SSR-safe reduced-motion store |

### Wired surfaces

- `/` — shiny label, BlurFade sections, BorderBeam privacy panel, ReflectionPass beam, HeroAmbient spotlight  
- `/start` — BlurFade + ModularLaunchCard BorderBeam  
- `/login` — BlurFade auth panel  

### Dependency

- `motion` (^12) added via npm  

### Verification

- `npm run lint` — pass  
- `npm run typecheck` — pass  
- Dev smoke: `/`, `/start`, `/login` HTTP 200 (local `npm run dev`)  
- Browser: Playwright **Chrome for Testing** via `npx playwright install chromium` + symlink `~/.local/bin/playwright-chrome` (system Google Chrome butuh root — diganti executable-path MCP).  
- Screenshots evidence: `.pi/screenshots/home-desktop.png`, `home-mobile.png`, `start-desktop.png`, `login-desktop.png`, `modules-desktop.png`.  

### Guardrails kept

- No rainbow/sparkles/number-ticker  
- No backend/AI/scoring changes  
- Continuous animations max: border-beam + shiny label; off under reduced-motion  

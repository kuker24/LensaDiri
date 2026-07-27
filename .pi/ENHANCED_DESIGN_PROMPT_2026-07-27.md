# Enhanced Design Prompt — LensaDiri final Soft Product pass

Generated via `/inb-enhance-prompt` vocabulary + design-review evidence (browser-act + Playwright, 2026-07-27).

## Product / scene

**Surface:** marketing homepage `/` + entry `/start` (task shell).
**Register:** product-serving brand portal (Design2 monochrome gallery).
**Scene sentence:** An Indonesian adult opens a quiet night portal; the HUD is featherweight over cinematic world art, then task UI goes calm for choosing a path.
**Color strategy:** restrained monochrome chrome; chromatic color only inside media.
**Voice:** quiet, precise, intimate Indonesian; no clinical certainty, no quiz kitsch, no SaaS hype.

## Visual system (locked)

| Role               | Spec                                                               |
| ------------------ | ------------------------------------------------------------------ |
| Void / canvas      | `#000000`                                                          |
| Surface            | `#111111`                                                          |
| Ink / bone         | `#ffffff`                                                          |
| Ash muted          | `#b8bab9`                                                          |
| Frost line         | `#e2e2e2` @ low alpha                                              |
| Charcoal CTA       | `#444345`                                                          |
| Type               | Plus Jakarta Sans (UI/display), JetBrains Mono (meta only)         |
| Radii Soft Product | control ~12px, panel ~16px, shell ~20px                            |
| Elevation          | hairlines only — no decorative shadows                             |
| Motion             | transform/opacity; ease-out expo; respect `prefers-reduced-motion` |

## Evidence from design review

### Working

- Hero portal + ReflectionPass instrument panel feels earned, not generic card grid.
- `/start` already has **one recommended modular path**; legacy under progressive disclosure.
- Peak-end close CTA strip exists (“Siap membaca polamu?”).
- Evidence tier copy on lens strip is partly explained.

### Defects to fix (priority)

1. **P0 — Content-gated scroll reveal**
   `BlurFade` with `inView` starts at `opacity: 0` / blur until IntersectionObserver fires. Full-page capture and fast scroll show film-strip **media without copy**. Violates Impeccable: reveal must enhance an already-visible default.

2. **P1 — Gradient-text micro-label tell**
   `AnimatedShinyText` uses `bg-clip-text` + linear gradient shimmer on the hero eyebrow. Absolute ban: gradient text. Prefer solid frost mono-label (optional opacity sheen without clipping text fill).

3. **P1 — Numbered scaffolding density**
   Process steps `01–03` earn numbers (true sequence). Lens catalog rows re-number `01–03` as decoration → AI section-factory habit. Drop decorative indices on non-sequence lists.

4. **P2 — Mono-label overuse**
   Trust principle titles use `mono-label` (tiny uppercase) as H3 voice. Keep mono for instrumentation only; trust titles should read as human product language.

5. **P2 — DESIGN.md drift**
   Docs still say Inter + 2px control radii; code is Plus Jakarta + Soft Product radii. Sync docs to code.

### Explicit non-goals (anti-slop)

- No number-ticker, sparkles, aurora, rainbow gradient text, glassmorphism default, violet CTA, fake metrics/social proof.
- No new Magic UI fireworks; keep existing BlurFade / BorderBeam / monochrome motion only if content-first.
- No backend, scoring, API, or AI narrative changes.

## Implementation brief (agent-executable)

Upgrade LensaDiri’s homepage and start entry for a **final anti-AI-slop Soft Product pass** while preserving Design2 monochrome portal identity.

1. **Harden `BlurFade`** so children are readable by default: never leave marketing content at opacity 0 waiting for in-view; use a hydration-safe fallback that forces visible within one frame budget if observer is late; reduced-motion remains plain static.
2. **Hero eyebrow:** replace gradient-clip shiny label with solid high-contrast mono-label (or retheme shiny without `background-clip: text`).
3. **Homepage lens rows:** remove decorative `01/02/03` indices; keep evidence badges and hairline rows.
4. **Trust block titles:** move from `mono-label` to normal weight sans titles.
5. **Peak-end CTA:** keep single charcoal primary + ghost Metode; optional quiet void film-strip, still not a card grid.
6. **`/start`:** keep single recommended modular card; ensure BorderBeam stays monochrome frost; no dual primary CTAs outside disclosure.
7. **Sync `DESIGN.md`** typography + radius to Soft Product truth.
8. **Verify:** lint + typecheck; Playwright/browser-act screenshots after; smoke accessible name `Kenali pola dirimu lewat banyak lensa.`

## Success criteria

- Mid-page sections show copy without requiring animation fire.
- No gradient-text or purple/neon chrome.
- One calm start path; legacy demoted.
- Still feels LensaDiri portal — not Linear clone, not quiz landing, not AI SaaS.

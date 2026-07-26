# Design System

## Direction

**MekaVerse portal for LensaDiri.** Monochrome gallery shell from `Design.md/Design2`: pure black void, white bone type, charcoal controls, frost hairlines. Full-bleed cinematic world art (video/photo) carries all color; UI chrome never competes. Quiet reflection product voice stays; airport, neon casino, and violet instrument chrome do not.

Physical scene: an adult opens a game-world portal at night; the interface is a featherweight HUD over a rendered diorama, then task surfaces go quiet for answering and reading.

Color strategy: **restrained monochrome chrome** across the app; **committed/drenched color only inside media**.

## Color

| Token            | Value     | Role                                      |
| ---------------- | --------- | ----------------------------------------- |
| `canvas` / void  | `#000000` | Page void behind art and UI               |
| `surface`        | `#111111` | Grouped product panel on void             |
| `surface-raised` | `#1a1a1a` | Inputs, dialogs, selected rows            |
| `ink` / bone     | `#ffffff` | Primary text and high-contrast edges      |
| `ink-muted`      | `#b8bab9` | Secondary text (ash)                      |
| `line` / frost   | `#e2e2e2` | Hairlines at low opacity on dark          |
| `charcoal`       | `#444345` | Primary filled actions                    |
| `lens`           | `#444345` | Alias: primary action (Design2 charcoal)  |
| `lens-strong`    | `#555456` | Hover/pressed primary                     |
| `lens-soft`      | `#1c1c1e` | Selected wash (neutral)                   |
| `aperture`       | `#e2e2e2` | Emphasis text on dark (frost, not violet) |
| `success`        | `#7DCEA0` | Success state                             |
| `warning`        | `#F2C879` | Warning state                             |
| `danger`         | `#FF8B95` | Error/destructive state                   |

Chromatic color lives in media only. Do not reintroduce violet as default CTA.

## Typography

- UI/display: Inter via `next/font/google` (Roobert substitute), weight 400 for monumental display.
- Chrome/labels: JetBrains Mono (GT America Mono substitute), 10–12px, tracking ≈ `-0.02em`.
- Display stacked mark: large sizes with line-height ≈ `0.78`; optional 1px frost underline mark 30–50% of line width on hero lines only.
- Body: 16px minimum on mobile controls, 1.6 line height, 65–72ch prose max.
- No Lora italic as brand hero voice under Design2.

## Layout

- Marketing: full-bleed film-strip sections (edge-to-edge art, 0 gap between world strips).
- Overlay copy: left-aligned, generous padding (20–80px), absolute or flex over art.
- Product flows: content max ~1200px, gutters 20/32/40; task density compact.
- Cards only when grouping needs a boundary; hairlines carry most hierarchy.
- Radii: controls **2px**, cards **10px**, large containers **20px**. Nothing larger.

## Shape And Elevation

- No decorative box shadows.
- Elevation: void → charcoal → ash + 1px frost hairlines only.
- Navigation: transparent sticky bar, 1px frost bottom border at low opacity. No frosted purple glass.

## Components

### Transparent Navigation

Sticky void-transparent strip. Wordmark left with small diamond glyph; mono links center; Masuk secondary + Mulai charcoal right. Mobile: horizontal scroll links, 44px targets.

### Hero World

Full-bleed muted video (or poster under reduced motion) with stacked h1 and charcoal Explore. Accessible h1 text must remain `Kenali pola dirimu` for smoke tests.

### Reflection Panel

Dark surface instrument panel with process steps and illustrative spectrum — no airport language. Hairlines and mono labels; progress marks use charcoal/bone, not violet bloom.

### Section Strips

Full-bleed stills or ambient video under mono overlay for marketing sections.

### Buttons

Primary: charcoal fill, bone text, 2px radius, optional 1px frost border. Secondary: void + frost hairline. Ghost: transparent. Press `scale(0.98)` 120ms. Focus ring frost/bone.

### Product Surface

Void canvas, surface panels, frost hairlines, 10–20px radius max. Selected: `lens-soft` neutral wash. Errors/success: semantic wash + text.

## Motion

- Product transitions: 150–220ms ease-out.
- Animate transform/opacity only.
- No orchestrated page-load sequence in assessment, auth, dashboard, or admin.
- Reduced motion: static poster, no spatial movement, short opacity feedback only.

## Media

Masters: `Design.md/Design2/Video/assets/`, `Design.md/Design2/Foto/assets/`.

Web ship: `public/media/hero-ambient.mp4`, `public/media/hero-poster.jpg`, `public/media/design2/*`.

Requirements: no people/text/logo/medical/neon-casino, poster fallback, muted autoplay, lazy-safe, reduced-motion static, verified provenance.

## Responsive And Accessibility

Test 360×800, 393×844, 768×1024, 1280×800, 1440×900. One `main`, one `h1` per page, visible labels, 44px targets, no forced horizontal page scroll, no content under sticky nav, no certification claims.

# Design System

## Direction

**Midnight Reflection Observatory.** LensaDiri adapts the supplied dope.security reference into a private space for observing inner patterns: a near-black canvas, a rationed violet signal, editorial italic display moments, mechanical mono orientation labels, hairline dividers, and flat surfaces. The visual language remains; security and travel content do not.

Physical scene: an adult opens LensaDiri late at night in a quiet room, seeking clarity without judgment; the screen feels like a precise instrument lit by one violet beacon.

Color strategy: restrained across product flows, committed only in the landing hero and result orientation surfaces.

## Color

| Token            | Value     | Role                                  |
| ---------------- | --------- | ------------------------------------- |
| `canvas`         | `#090909` | Page void                             |
| `surface`        | `#111113` | Primary grouped surface               |
| `surface-raised` | `#18181C` | Inputs, dialogs, selected rows        |
| `ink`            | `#F7F9FA` | Primary text                          |
| `ink-muted`      | `#A4A4AC` | Secondary text; body-safe contrast    |
| `line`           | `#34343B` | Hairline boundaries                   |
| `lens`           | `#AF50FF` | Primary action and current state only |
| `lens-strong`    | `#9635E9` | Hover/pressed accent                  |
| `lens-soft`      | `#251431` | Selected and informational wash       |
| `lavender`       | `#E1BDFF` | Text on violet/dark emphasis          |
| `success`        | `#7DCEA0` | Success state                         |
| `warning`        | `#F2C879` | Warning state                         |
| `danger`         | `#FF8B95` | Error/destructive state               |

Violet appears as one hero bloom, primary actions, progress/current selection, and rare accent strokes. It is not body text decoration or a default card border.

## Typography

- UI/body: Inter via `next/font/google`.
- Display: Lora italic as the legal substitute for GrandSlang. Use only for large brand moments, never labels or controls.
- Stamp/data: JetBrains Mono as the legal substitute for Whyte Inktrap Mono. Use for short orientation labels and numerical metadata.
- Display ceiling: 96px; mobile minimum 48px; letter spacing no tighter than `-0.04em`.
- Body: 16px minimum on mobile controls, 1.6 line height, 65-72ch maximum prose.

## Layout

- Content max width: 1200px.
- Page gutters: 20px mobile, 32px tablet, 40px desktop.
- Marketing section rhythm: 96-128px desktop, 72-88px mobile.
- Product flow rhythm: 32-64px; task content stays compact and predictable.
- Landing hero: 55/45 split; atmospheric CSS field left/behind, reflection-pass panel right.
- Cards only group content that needs a boundary. Rows and hairlines carry most hierarchy.

## Shape And Elevation

- Cards: 19px radius.
- Buttons: 8px radius; pill only for compact status/secondary hero actions.
- Inputs/small controls: 8px/6px.
- No decorative box shadows. Elevation comes from hairlines, surface contrast, and one purposeful nav blur.
- Frosted navigation is the single recurring glass surface.

## Components

### Frosted Navigation

Sticky near-black translucent strip, 10px blur, low-opacity bottom hairline. Wordmark left; compact navigation center; login and primary start action right. Mobile navigation remains horizontally reachable without hiding core routes.

### Reflection Pass

Hero orientation panel adapted from the boarding-pass reference. It communicates process, privacy, and illustrative spectrum data. No airport language, barcode, origin/destination, or fake product metrics.

### Section Stamp

Mono uppercase signpost with wide tracking. Use once per major marketing section, responsive down from 64px. Product pages use compact mono labels instead.

### Buttons

Primary: violet fill with near-black text. Secondary: dark surface with almost-white hairline. Ghost: transparent. All have focus, active scale feedback, disabled, and pending states.

### Product Surface

Near-black/surface contrast, one hairline, 19px radius where grouping is necessary. Avoid nested cards. Selected states use `lens-soft`; errors/success use semantic wash plus text.

### Result Orientation

Dark surface with one violet radial bloom. Evidence, confidence, and limitations remain readable text, never encoded by color alone.

## Motion

- Product transitions: 150-220ms.
- Enter: strong ease-out; state movement: ease-in-out.
- Animate transform/opacity; progress transform is allowed.
- Buttons press to `scale(0.98)` for 120ms.
- No orchestrated page-load sequence in assessment, auth, dashboard, or admin.
- Reduced motion removes spatial movement and preserves short opacity/color feedback.

## Media

CSS atmosphere is the production default. A generated photo or 30-second ambient video may be added only when it materially improves the landing hero. Requirements: no people or diagnostic symbolism, no text baked into media, poster fallback, muted, no required autoplay, lazy loading, mobile-safe crop, reduced-motion static fallback, and verified licensing/provenance.

## Responsive And Accessibility

Test at 360x800, 393x844, 768x1024, 1280x800, and 1440x900. Keep one `main` landmark, one `h1`, visible labels, 44px targets, no forced horizontal page scroll, no content hidden behind sticky nav, and no certification claim.

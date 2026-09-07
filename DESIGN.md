# Design System

## Direction

**Dala void for LensaDiri.** Deep-black monumental interface from the Dala world
(`.impeccable/found-this-design/batch2/05-vana-dala__dala.prompt.txt`): pure void,
sculptural tight-tracked type, hairline restraint. One violet constellation —
a constructed head in profile, triangle mesh — carries all color and
meaning; chrome never competes. Quiet reflection product voice stays; airport,
neon casino, gallery monochrome, and violet instrument chrome do not.

Physical scene: a face turned toward its own constellation; the interface is
the dark surface the stars are plotted on, then task surfaces go quiet for
answering and reading.

Color strategy: **void + bone + violet-action + saffron-punctuation** across
the app; verdant/saffron/rose only as lens identity accents inside results.

## Color

| Token            | Value     | Role                                        |
| ---------------- | --------- | ------------------------------------------- |
| `void`           | `#000000` | Page void behind everything                 |
| `surface`        | `#0b0b0e` | Grouped product panel on void               |
| `surface-raised` | `#15151b` | Inputs, dialogs, selected rows              |
| `bone`           | `#f2f1ec` | Primary text (warm, not pure white)         |
| `ink-muted`      | `#a7a5a0` | Secondary text (ash)                        |
| `hairline`       | `#232330` | Hairlines, borders, track fills             |
| `iris`           | `#8052ff` | Primary action, constellation, focus, marks |
| `iris-deep`      | `#5b3df0` | Primary gradient end / pressed              |
| `saffron`        | `#ffb829` | Punctuation accent, warnings, highlights    |
| `verdant`        | `#15846e` | Success state                               |
| `rose`           | `#f43f5e` | Error/destructive state                     |

Violet is reserved for action and the constellation. Do not use iris as body
text, and do not reintroduce charcoal or gallery monochrome as default CTA.

## Typography

- Display/UI: **Archivo** via `next/font/google`, weights 400–800 with
  `Archivo Expanded` for the hero. Tight tracking (`-0.04em` display,
  `-0.02em` UI), line-height ≈ `0.95` on stacked monumental lines.
- Chrome/labels: JetBrains Mono, 10–12px, uppercase, tracking ≈ `0.14em` —
  **meta/instrumentation only**, not section titles or trust copy.
- Hero device: stacked `display-stack` lines with one **saffron terminal
  punctuation** (period) and small mono kicker above — kicker is the single
  allowed eyebrow, hero-only.
- Body: 16px minimum on mobile controls, 1.6 line height, 65–72ch prose max.
- No gradient-clip text (`background-clip: text` + gradient fill) anywhere.

## Layout

- Marketing: void-first rows, generous vertical rhythm (`py-24/32`), content
  max ~1200px, gutters 20/32/40; full-bleed only for the constellation field.
- Hero: split field — stacked headline left, constellation figure right
  (desktop); stacked with capped constellation height (mobile + scrim).
- Product flows: content max ~1200px; task density compact.
- Hairlines carry hierarchy; panels only when grouping needs a boundary.
- Radii: pill controls, `~16px` panels, `~20px` large containers.
- Scroll reveal must be **content-first**: never leave marketing copy at
  opacity 0 waiting for IntersectionObserver.

## Shape And Elevation

- No decorative box shadows.
- Elevation: void → raised panel → hairline; violet reserved for action glow.
- Navigation: transparent sticky bar over void with backdrop blur, 1px hairline
  bottom border. No colored glass.

## Components

### Transparent Navigation

Sticky void-transparent strip with blur. Wordmark left (iris diamond +
bone wordmark); mono links center; Masuk ghost + Mulai iris pill right.
Mobile: horizontal scroll links, 44px targets.

### Constellation Field

The signature: deterministic triangle-mesh head-in-profile (`constellation.tsx`,
seeded PRNG, no image assets), iris-tinted nodes with violet glow on canvas
dots, mono coordinate readout. Right-column figure on desktop, capped-height
band with bottom scrim on mobile.

### Lens Rows

Marketing content as hairline-separated rows (eyebrow + statement or
descriptor), never card grids — refusal of the form-card cliché.

### Buttons

Primary (`brand`): iris→iris-deep gradient pill, bone text, violet shadow.
Secondary: void + hairline border. Ghost: transparent. Destructive: rose.
Press `scale(0.98)` 120ms. Focus ring iris.

### Product Surface

Void canvas, raised panels, hairline borders. Selected: iris `/10` wash.
Progress marks: iris fill on hairline track. Errors/success: semantic color

- text, never color alone.

## Motion

- Product transitions: 150–220ms ease-out; hero single-moment reveal
  (transform/opacity, interruptible, completes < 1s).
- Animate transform/opacity only.
- No orchestrated page-load sequence in assessment, auth, dashboard, or admin.
- Reduced motion: static constellation, no spatial movement, short opacity
  feedback only.

## Media

No photographic or video media in the Dala world: the constellation is pure
SVG, fully offline. If media is ever introduced: no people/text/logo/medical
content, static fallback under reduced motion, verified provenance.

## Responsive And Accessibility

Test 360×800, 393×844, 768×1024, 1280×800, 1440×900. One `main`, one `h1`
per page (`Kenali pola dirimu` on landing, kept for smoke tests), visible
labels, 44px targets, no forced horizontal page scroll, no content under
sticky nav, no certification claims. Step numerals are sequential content,
not section numbering.

# Design System

## Direction

**Vinyl Gallery for LensaDiri.** The interface borrows the physical language of a warm designer-toy exhibition: soft-vinyl figurines, paper display cards, rounded vitrines, large packaging typography, and four colored stages. It stays playful without turning reflection into a game. Product truth always outranks collectible decoration.

The primary journey is `anonymous gallery -> choose a visual form -> required 16-Type -> claim -> four optional tests in fixed order -> full podium at 5/5`. Tests run one at a time. Type names remain hidden until the first result is claimed. Partial progress lives on a workbench, not a full podium. Account and administrative surfaces inherit the same typography, color, and controls without becoming character stages.

## Color

| Token            | Value     | Role                     |
| ---------------- | --------- | ------------------------ |
| `canvas`         | `#fbf9f5` | Warm paper background    |
| `surface`        | `#ffffff` | Cards and vitrines       |
| `surface-raised` | `#f5f3ef` | Inset trays and controls |
| `ink`            | `#1b1c1a` | Primary text             |
| `ink-muted`      | `#56423c` | Supporting text          |
| `line`           | `#e4e2de` | Borders and tracks       |
| `primary`        | `#9d4223` | Actions and focus        |
| `SP`             | `#f4845f` | Explorer stage           |
| `SJ`             | `#6bbf7a` | Sentinel stage           |
| `NF`             | `#e882b4` | Diplomat stage           |
| `NT`             | `#6eb5ff` | Analyst stage            |

Stage colors are light fills. Text on them must use the matching dark stage ink: SP `#6c1e02`, SJ `#002109`, NF `#681847`, NT `#0b2f52`. White text on these fills is forbidden. Results without an explicit 16-Type or Temperament use the neutral paper stage rather than an inferred group.

## Typography

- Display and packaging headings: Anton, uppercase, compact line-height, moderate tracking.
- Body and controls: Plus Jakarta Sans, 500-800 weights.
- Monospace is limited to measurements, progress, codes, and compact metadata.
- Headings carry the hierarchy; decorative labels do not repeat them.
- Public copy is short, direct Indonesian. Do not use collectible jargon as a factual claim.

## Layout

- Landing is a single `100dvh` stage with anonymous figures around one large active cutout and a ghost `POLA` mark.
- Task screens use one dominant action area and preserve generous gallery margins.
- Desktop may use split figure/content layouts. Mobile prioritizes the task and stacks cards without horizontal overflow.
- Claim and podium keep the first paint short. Scientific detail, confidence, export, feedback, and deletion live under Uraian.
- Operational pages use calm paper surfaces and normal information density, not hero carousels.

## Shape And Material

- Main cards: 24-32px radii with warm diffuse shadows and a fine border.
- Inner image trays: 16-20px radii.
- Primary actions and compact status controls: continuous pills.
- Figurines are transparent PNG cutouts, grounded by soft contact shadows. Never place an opaque white card inside the image frame.
- Blur is reserved for acrylic navigation or ambient stage light, not generic decoration.

## Components

### Gallery Carousel

The active figure is large and sharp; immediate neighbors are smaller with 2px blur; the second ring uses 4px blur. Public text exposes only collection position, never a type code, archetype name, group label, or revealing image alternative text.

### Form Selection

Two large figure cards choose appearance only. The selected state uses primary outline, warm wash, and a clear check. Age and explicit consent sit below the visual choice. The primary path starts the 16-Type Normal lens; composing other lenses remains secondary.

### Reflection Runner

The question card is dominant. Progress and save state remain visible. The blank figure is a quiet companion on desktop and may recede on mobile. Autosave, pause, resume, keyboard controls, errors, and clarifiers keep their existing behavior.

### Claim, Workbench, And Podium

Claim is the first place an actual type may appear. The workbench exposes exactly one available next test in this order: Enneagram, Socionics-inspired, Big Five/SLOAN, Attitudinal Psyche. Future steps remain locked. It never depicts an unearned result. Partial collections use `POLAMU SAAT INI`; `PODIUM PENUH` is reserved for 5/5. Shared cards retain the server allowlist and omit private diagnostics.

## Motion

- Carousel movement: 650ms `cubic-bezier(0.4, 0, 0.2, 1)` for spatial continuity.
- Frequent controls: 140-220ms with strong ease-out; button press scales to 0.97.
- Avoid `transition: all`, unbounded ambient loops, and hover movement on touch devices.
- Dynamic state uses interruptible CSS transitions rather than keyframes.
- Reduced motion removes spatial travel and blur changes while retaining short color or opacity feedback.

## Content Boundaries

- Do not show a type before Claim.
- Do not invent authenticity, rarity, certification, material specification, user counts, or scientific validation.
- Do not infer an NT/NF/SJ/SP stage from Trait, RIASEC, Enneagram, Attachment, or another unrelated lens.
- Use “pola”, “refleksi”, “lensa”, “pertanyaan”, and concrete action labels. Avoid pseudo-clinical or collector-industry jargon.

## Responsive And Accessibility

Verify 390x844 and 1440x900 together. Every page has one `h1`, visible focus, 44px minimum controls, no horizontal page overflow, useful loading/error/disabled states, and contrast-safe text. The landing keeps an accessible `h1` containing “Kenali pola dirimu”. Reduced motion, keyboard navigation, and server-authoritative scoring are permanent constraints.

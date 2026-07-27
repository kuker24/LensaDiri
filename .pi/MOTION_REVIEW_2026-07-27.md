# Motion review — Emil Kowalski standards

Date: 2026-07-27  
Branch: `design/opendesign-iteration`  
Skills: `emil-design-eng`, `inb-emilkowalski-motion`, `review-animations`

## What shipped

- One motion language via CSS tokens: `--ease-out`, `--duration-press` (140ms), `--duration-ui` (180ms), `--duration-reveal` (480ms), `--duration-spectrum` (450ms), `--duration-film` (700ms).
- Shared classes: `.ui-transition`, `.pressable` (scale 0.97 on active), `.decision-tile` (scale 0.98), `.likert-option` (color only).
- Marketing trim: hero/reveal shorter + blur 2px; spectrum 450ms; film zoom without permanent `will-change`.
- Toast + dialog use transitions/`@starting-style` (interruptible), not open-only keyframes.
- Reduced motion: no movement; short color/opacity (120ms) retained for state comprehension.
- Dead `duration-1000` panel transition removed from home.

## Formal review-animations

See session closeout for Part 1 table + Part 2 verdict: **Approve**.

## Verify

- `prettier` on touched sources
- `git diff --check`
- `npm run lint`
- `npm run typecheck`
- `npx vitest run tests/unit/modular-start-form.test.tsx` → 6/6

Not run: full e2e (needs disposable DB), commit/push (not requested).

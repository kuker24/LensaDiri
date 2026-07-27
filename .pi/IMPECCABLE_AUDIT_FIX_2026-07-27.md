# Impeccable audit + fix — 2026-07-27

Scope: product register web UI; frontend-only. Commands: audit → polish/clarify/layout alignment.

## Audit health (post-fix estimate)

| # | Dimension | Score | Key finding |
| --- | --- | --- | --- |
| 1 | Accessibility | 3 | Focus rings, 44px targets, labels; charcoal fill vs void still low silhouette (text-on-button OK) |
| 2 | Performance | 3 | Transform/opacity motion; media film strips OK; no layout thrash |
| 3 | Responsive | 3 | Task shells + sticky nav; mobile menu details |
| 4 | Theming | 4 | Design2 tokens; radius 2/10/20 aligned |
| 5 | Anti-patterns | 4 | Monochrome portal; no violet/gradient-text/card grid slop |
| **Total** | | **17/20** | **Good** |

## Fixed this pass

- **Radius drift:** `rounded-md`/`lg` → control `2px`, panel `10px` (dialog, toast, skeleton, privacy panels, etc.)
- **CTA theming:** primary uses `border-frost`, `hover:bg-lens-strong` (no raw `#e2e2e2` hex)
- **Anti shadow:** mobile menu drop-shadow removed (DESIGN: no decorative shadows)
- **Dialog:** radius + pressable close; drop decorative backdrop-blur
- **Touch:** footer links + brand mark `min-h-11`
- **Clarify ID:** evidence one-liner on home; method tiers Indonesian; modules badge “Tingkat bukti”; privacy/launch “Privat”/“multi-lensa”
- **Tracking:** auth success label uses `.mono-label` (−0.02em)

## Residual (not P0)

- Charcoal `#444345` vs void silhouette ≈2.1:1 (button *chrome* edge; label bone-on-charcoal ≈9.8:1) — mitigated by stronger frost border
- Numbered 01–03 process steps intentional sequence, not AI eyebrow spam
- Full e2e/browser visual not re-run this pass

## Verify

- prettier + `git diff --check`
- `npm run lint`
- `npm run typecheck`

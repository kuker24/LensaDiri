# Manual accessibility checklist (#44)

Engineering auto gates: `docs/qa/ACCESSIBILITY_AUDIT.md`, `docs/qa/ACCESSIBILITY_ENGINEERING_AUDIT.md`, `npm run test:a11y`.
**This file is not WCAG certification.** Do not self-certify AA/AAA from CI or this checklist alone.

## When to run

- Before claiming “manual a11y done”
- After major UI flow changes (start, runner, result, auth, admin)
- Optional: periodic maintenance smoke

## Environment

| Item            | Suggestion (free)                                                 |
| --------------- | ----------------------------------------------------------------- |
| Desktop browser | Firefox or Chromium latest                                        |
| Mobile          | Android TalkBack **or** iOS VoiceOver if device available         |
| SR desktop      | NVDA (Windows, free) **or** Orca (Linux) **or** VoiceOver (macOS) |
| Keyboard        | Unplug/ignore pointer for keyboard-only pass                      |
| Contrast        | OS dark/light + browser zoom 200% spot-check                      |

If no SR device: complete keyboard + zoom + contrast sections; leave SR rows **BLOCKED_HUMAN** with date.

## Routes (minimum)

Public: `/` `/modules` `/combos` `/start` `/method` `/privacy` `/disclaimer` `/login` `/register`
Auth: `/dashboard` (if account)
Flow: assessment runner (fixture or real session) → private result → share view
Admin: `/admin/*` only if admin account exists (prod may have **0** admins)

## Keyboard-only

| #   | Check                                                     | Pass? | Notes |
| --- | --------------------------------------------------------- | ----- | ----- |
| K1  | Skip link works; focus visible                            |       |       |
| K2  | All primary actions reachable without pointer             |       |       |
| K3  | Tab order logical; no trap (except modal)                 |       |       |
| K4  | Modal/dialog: focus contain, Escape closes, restore focus |       |       |
| K5  | Likert: arrows/space/enter per control pattern            |       |       |
| K6  | Errors focusable / announced path exists                  |       |       |

## Screen reader (one engine is enough for hobby note)

| #   | Check                                                  | Engine | Pass? | Notes |
| --- | ------------------------------------------------------ | ------ | ----- | ----- |
| S1  | Page title + one h1 announced                          |        |       |       |
| S2  | Landmarks / nav names make sense                       |        |       |       |
| S3  | Form labels associated; errors tied                    |        |       |       |
| S4  | Autosave / live regions not silent spam                |        |       |       |
| S5  | Progressbar name + value                               |        |       |       |
| S6  | Result bars have text alternative                      |        |       |       |
| S7  | Share page: no private diagnostics leaked in SR buffer |        |       |       |

## Mobile / touch

| #   | Check                                | Pass? | Notes |
| --- | ------------------------------------ | ----- | ----- |
| M1  | Primary targets ~44px                |       |       |
| M2  | No horizontal overflow               |       |       |
| M3  | Inputs ≥16px (no iOS zoom fight)     |       |       |
| M4  | Reduced motion: OS setting respected |       |       |

## Contrast / visual

| #   | Check                                     | Pass? | Notes |
| --- | ----------------------------------------- | ----- | ----- |
| C1  | Body text readable on light + dark        |       |       |
| C2  | Warning + aperture tokens on dark surface |       |       |
| C3  | Focus ring visible on both surfaces       |       |       |
| C4  | Status not color-only                     |       |       |

## Copy honesty

| #   | Check                                                      | Pass? |
| --- | ---------------------------------------------------------- | ----- |
| H1  | No diagnosis / certainty claims on checked routes          |       |
| H2  | Provisional precision disclaimer still present where shown |       |

## Record

| Field                 | Value                      |
| --------------------- | -------------------------- |
| Date                  |                            |
| Tester                |                            |
| OS / browser / SR     |                            |
| Critical findings     | (file issues; fix-forward) |
| Residual              |                            |
| WCAG third-party cert | **not claimed**            |

Save dated notes under `docs/qa/` (e.g. `docs/qa/manual-a11y-YYYY-MM-DD.md`) **or** attach to issue #44. No secrets.

## Done when (#44)

- [ ] Dated manual note exists
- [ ] Critical findings fixed or accepted with risk note
- [ ] Cert only if external auditor issues it
- [ ] Else close as **manual-pass-without-cert** or leave open **BLOCKED_EXTERNAL** for cert only

## Related

- Auto audit: `docs/qa/ACCESSIBILITY_AUDIT.md`
- Eng status: `docs/qa/ACCESSIBILITY_ENGINEERING_AUDIT.md`
- E2E: `tests/e2e/accessibility.spec.ts`

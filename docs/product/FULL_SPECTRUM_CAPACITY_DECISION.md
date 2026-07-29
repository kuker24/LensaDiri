# Full Spectrum capacity decision (#42)

**Date:** 2026-07-26
**Mode:** hobby / free tier
**Status:** **AMENDED 2026-07-29 — custom 1–10 lenses may use one segmented assessment**

## 2026-07-29 amendment

The database preset `full_spectrum` remains draft. Users may nevertheless select any 1–10
available lenses as a custom combo in Quick, Normal, or Complex. When minimum valid module
coverage exceeds the mode's ideal target, the estimate expands to that minimum and the existing
segment plan divides the assessment without reducing per-module coverage.

This amendment supersedes the rejection of over-target custom combos and the separate-session
guidance below. Experimental acknowledgment, age rules, independent scoring, pause/resume, and
the per-segment cap remain unchanged.

## Original problem

| Fact                                | Value                                                                |
| ----------------------------------- | -------------------------------------------------------------------- |
| Complex cap                         | **120** items (`target_item_max` + segment max)                      |
| `full_spectrum` modules             | **10** (all lenses; psychosophy optional experimental)               |
| Σ deepQuota (approx)                | **~341** before clamp                                                |
| Min dimension coverage (10 modules) | **> 120** → estimate returns `coverage_unavailable`                  |
| Production status                   | **`draft`** (hidden from public combo list)                          |
| Working substitute                  | `deep_self_discovery` **pilot** (~6 lenses, min coverage ~102 ≤ 120) |

Publishing `full_spectrum` as one Complex session **violates** composer capacity contract.

## Options considered

| Option                                                   | Under cap? | Cost                                                  | Decision                     |
| -------------------------------------------------------- | ---------- | ----------------------------------------------------- | ---------------------------- |
| A. Force publish 10-lens single session                  | No         | Breaks estimate/composer                              | **Rejected**                 |
| B. Raise Complex cap / multi-session schema in one PR    | Maybe      | Large feature; not maintenance                        | **Rejected for hobby close** |
| C. Shrink all deepQuota + min coverage to fit 10× in 120 | Fragile    | Hurts per-module quality; needs new versions + retest | **Deferred**                 |
| D. Split into sequential presets / custom path           | Yes        | Docs + UX honesty only                                | **Accepted (default)**       |
| E. Permanent draft / wontfix key                         | Yes        | Zero code                                             | Acceptable fallback of D     |

## Decision (binding for hobby)

1. **`full_spectrum` remains `draft`.** Do not call `publish_combo_preset` while over cap.
2. **User path for “all lenses”** = multi-session:
   - Session 1: `deep_self_discovery` (or Core + Deep equivalent custom ≤120)
   - Session 2+: custom combo of remaining modules under Complex/Normal quotas
   - Optional experimental: `psychosophy` only with acknowledgment
3. **Copy:** public surfaces must not imply one-click Full Spectrum until a future capacity-safe preset exists.
4. **Future redesign (out of this close)** only if funded:
   - New additive combo keys (e.g. spectrum_core + spectrum_extended), each min coverage ≤120, **or**
   - Product change to multi-session orchestration with shared account history (schema/UX work)

## Capacity-safe spectrum map (no schema change)

Use existing published/pilot presets + custom; do not invent fake published `full_spectrum`.

| Wave | Intent                       | Example selection                                                                      | Mode           |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------- | -------------- |
| 1    | Core depth                   | `deep_self_discovery` (trait, type_16, enneagram, three_center, temperament, instinct) | Complex        |
| 2    | Interest + bond              | custom: riasec + attachment (+ optional one more under estimate)                       | Normal/Complex |
| 3    | Communication + experimental | custom: socionics_communication; psychosophy only with ack                             | Normal/Complex |

Always run `/api/assessment/estimate` (or Start UI) before start; `coverage_unavailable` = shrink selection.

## Implementation freeze

- **No** migration that sets `full_spectrum` status to pilot/published in this residual.
- **No** raising Complex 120 without a separate product RFC + tests.
- Seeds/migrations that describe over-cap draft copy remain accurate.

## Done criteria for #42

| Outcome                                                      | Close #42 as                                 |
| ------------------------------------------------------------ | -------------------------------------------- |
| This decision accepted + docs linked from gates/handoff      | **decided / multi-session** (hobby complete) |
| Later: new capacity-safe preset keys + tests + honest status | reopen or follow-up issue                    |

## Non-claims

- Full Spectrum is **not** a single selectable production preset today.
- Multi-session path is product guidance, not automatic cross-session scoring merge.

## Related

- Estimate: `src/lib/assessment/estimate.ts`
- Cap seed: `supabase/seed/20260714_modular_catalog.sql` (deep 100–120)
- Draft lock: `supabase/migrations/202607270001_guarded_all_lenses_release.sql`
- Gates: `docs/deployment/RELEASE_CLOSURE_GATES.md`

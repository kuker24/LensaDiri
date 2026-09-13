# Scoring confidence audit (2026-09-13)

**Status:** audit only · **no code changed** · findings pending decision
**Scope:** the per-module confidence/quality model, not the primary scoring engines.
**Ban:** nothing here licenses a public accuracy claim. Fixing the defects below would make confidence _more honest_, not the instrument _more valid_. Validity still requires the work in `PSYCHOMETRIC_VALIDATION_PREP.md`.

## Why this audit exists

`confidence` is the only number the product shows about its own trustworthiness. It appears on the podium, in the web report, and on the PDF cover page, described as "kelengkapan dan konsistensi jawaban". This audit asks a narrow question: does the number measure what that sentence claims?

Partly. Completeness is measured well. **Consistency is largely unmeasured**, and for five of ten modules it is structurally unmeasurable with the items that exist today.

## How confidence is computed

`assessModuleQuality()` in `src/lib/scoring/quality.ts:170` sums four weighted components, subtracts flag penalties, then clamps to `[0, 1]`:

| Component            | Weight | Source                                       |
| -------------------- | -----: | -------------------------------------------- |
| `completion`         |   0.35 | answered / expected items                    |
| `dimensionCoverage`  |   0.25 | distinct constructs touched / constructs     |
| `reverseConsistency` |   0.20 | see finding 1                                |
| `1 - ambiguity`      |   0.20 | distance from the 50-point decision boundary |

Two model versions exist. `module-quality-1` is the legacy formula. `module-quality-2` adds contradiction-pair detection plus four bounded context factors. **New sessions already use `module-quality-2`** — it is hardcoded at `src/server/repositories/blueprints.ts:225`, and every blueprint in the local database carries that value. Read paths never recompute; `resolveQualityModelVersion()` fails closed on an unknown version.

## Finding 1 — `reverseConsistency` does not measure consistency

`src/lib/scoring/modules/types.ts:74-77`:

```ts
const reverseConsistency =
  reverseAnswers.length === 0
    ? 1
    : reverseAnswers.filter((answer) => answer.value !== 3).length / reverseAnswers.length;
```

This counts reverse-keyed answers that are **not exactly the midpoint**. It never compares a reverse item against its forward counterpart, so it cannot detect disagreement in _direction_ — only refusal to sit on the fence. Answering "strongly agree" to both a claim and its opposite scores a perfect 1.0.

Measured, with 6 forward and 6 reverse items on one construct:

| Answer pattern                                | `reverseConsistency` | `module-quality-1` confidence |
| --------------------------------------------- | -------------------: | ----------------------------: |
| Coherent (forward 4-5, reverse 1-2)           |                  1.0 |                          1.00 |
| Self-contradictory (forward 4-5, reverse 4-5) |                  1.0 |                          0.90 |

The contradictory run loses 0.10 only because it trips `low_variance`, which is incidental — it is not the contradiction being detected. Under `module-quality-2` the same answers score **0.75** with `contradictionRate: 1` and an `inconsistent_pair` flag, because `contradictionRate()` (`quality.ts:103`) does the real comparison: reverse-code both directions, then flag a per-construct mean gap above 1.5.

So the live model does catch this. The stale `reverseConsistency` term still contributes its full 0.20 on top, which is why the contradictory case lands at 0.75 rather than lower. The signal is diluted, not absent.

## Finding 2 — five modules cannot measure consistency at all

`reverseAnswers.length === 0` returns `1`. A module with no reverse-keyed items is therefore handed the full 0.20 unconditionally. Verified against the local database (`questions` joined to `module_versions`):

| Module                    | Forward | Reverse | Consistency measurable? |
| ------------------------- | ------: | ------: | ----------------------- |
| `trait_profile`           |     132 |      48 | yes                     |
| `enneagram`               |     105 |      21 | yes                     |
| `type_16`                 |      32 |      16 | yes                     |
| `socionics_communication` |      24 |      16 | yes                     |
| `temperament`             |      28 |       8 | yes                     |
| `attachment`              |      32 |   **0** | **no**                  |
| `psychosophy`             |      48 |   **0** | **no**                  |
| `riasec`                  |      36 |   **0** | **no**                  |
| `three_center`            |      21 |   **0** | **no**                  |
| `instinct`                |      18 |   **0** | **no**                  |

For those five, `contradictionRate()` also returns 0 — it requires both polarities on the same construct. Neither the old term nor the new one contributes any real information.

## Finding 3 — three modules hardcode `ambiguity: 0`

`riasec.ts:27`, `psychosophy.ts:28`, and `trait-profile.ts:36` pass a literal `ambiguity: 0` rather than calling `getBoundaryAmbiguity()`. That awards the full 0.20 for "the result is not near a decision boundary" without checking.

Combined with finding 2, `riasec` and `psychosophy` collect **0.40 of the 1.00** from two components that are constants for them. A fully answered `riasec` module scores **1.00** confidence with varied, un-flagged answers — a ceiling that cannot distinguish a careful respondent from a careless one.

## Finding 4 — `consistency_pair_key` is declared but never populated

`question_dimension_mappings.consistency_pair_key` exists in the schema. All **585** mapping rows have it `null`; every seed inserts a literal `null`. Explicit item pairing is the standard way to check consistency, and the column is provisioned for it, but the data is absent. `contradictionRate()` works around this by grouping on `constructKey`, which is coarser: it compares construct means rather than matched item pairs.

## Finding 5 — undocumented constants

These appear with no derivation, source, or calibration note:

- `Math.min(1, responses / 6)` — the six-response saturation in module engines
- `1 - gap / 25` — tie-proximity scaling
- `Math.max(0, 1 - closest / 20)` — boundary ambiguity width (`types.ts:57-63`)
- `> 1.5` — the contradiction gap threshold on a 1-5 scale
- Every flag penalty (`0.30` straightlining, `0.15` reverse inconsistency, `0.12` too-fast, …)
- The four component weights themselves (`0.35 / 0.25 / 0.20 / 0.20`)

Each is defensible as a first pass. None is traceable to data, and their combination decides a number shown to users as a quality judgement.

## What is sound

Worth stating plainly, because the above is a list of defects:

- `completion` and `dimensionCoverage` measure exactly what they claim.
- `contradictionRate()` is a genuine directional consistency check, and it is live.
- The flag set is broad and sensibly chosen: straightlining, low variance, too-fast, excessive midpoint, threshold ambiguity.
- Versioning is disciplined. `module-quality-1` is byte-frozen, dispatch fails closed on unknown versions, and stored results are never recomputed — so no fix can silently rewrite history.
- Confidence is correctly withheld (`null`) for experimental-tier modules instead of being invented.
- The user-facing wording already says this measures answer quality, not identity accuracy. That is honest framing for a weak signal.

## What a fix would require

Any real remedy is **backend/domain scope, which is currently frozen**. Recording the shape so the decision is informed:

1. **`module-quality-3`.** Redefine `reverseConsistency` as directional agreement, and return a `null`-like "not measurable" instead of `1` when a module has no reverse items — so the weight redistributes rather than being gifted.
2. **A migration** widening the `CHECK` at `supabase/migrations/202607200002_quality_model_version.sql:11`, which currently admits only `module-quality-1` and `module-quality-2`.
3. **Additive item-bank versions** adding reverse-keyed items to the five modules that lack them, plus real `consistency_pair_key` values. Published content is immutable by database trigger; this means new versions, not edits.
4. **Human review.** Publishing requires `release_disposition = 'RELEASE_READY'` and a reviewer. New items are new psychometric content.
5. **Replacing the three hardcoded `ambiguity: 0` calls** with real `getBoundaryAmbiguity()` computation.

Old results keep their stored numbers under their stored model version. No recomputation, by design.

## Recommendation

Sequenced by cost against honesty gained:

| #   | Action                                                             | Cost                            | Effect                                        |
| --- | ------------------------------------------------------------------ | ------------------------------- | --------------------------------------------- |
| 1   | Document the constants in code comments, marking them uncalibrated | none, no behaviour change       | stops future readers treating them as derived |
| 2   | Replace hardcoded `ambiguity: 0` in the three engines              | small, needs `module-quality-3` | removes two free 0.20 grants                  |
| 3   | Redefine `reverseConsistency` directionally; stop gifting 1.0      | medium, needs migration         | confidence starts tracking coherence          |
| 4   | Add reverse items + pair keys to the five bare modules             | large, needs reviewer           | makes consistency measurable at all           |
| 5   | Calibrate weights against pilot data                               | largest, needs n≈100/module     | the only step that makes the number empirical |

Until step 5, confidence is a **heuristic completeness score with partial coherence detection**. The product's current wording is compatible with that. It must not be described as measuring how well a result fits the person.

## Note on `NewDesign_V1/Pengetahuan/`

Reviewed for scoring relevance; **not usable as a source**. `Data.txt` (3142 lines) describes Enneagram instinctual subtypes and `Data2.txt` (554 lines) covers Socionics duality, both as third-party prose with citations. Coverage is partial: SO1-9 complete, SX5-9 complete, **SP1-9 entirely absent**, SX1-4 only brief countertype notes, and 18 entries are `Halaman NNN` stubs. There are no items, no keying, no thresholds, and no norms.

More decisively, it describes constructs the engine does not measure. The `instinct` module has 18 items producing `sp`/`so`/`sx` and never emits a subtype like `SX5`, so most of that folder has no target in the codebase. Any future use must be paraphrased rather than copied, per the item-reuse ban in `AGENTS.md`.

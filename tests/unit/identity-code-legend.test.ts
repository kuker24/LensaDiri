import { describe, expect, it } from "vitest";

import { buildCollectibleIdentity } from "@/lib/assessment/identity-journey";
import { buildIdentityCodeLegend } from "@/lib/report/identity-code-legend";
import {
  enneagramJourneyConstructKeys,
  scoreEnneagramJourneyModule,
} from "@/lib/scoring/modules/enneagram";
import {
  psychosophyConstructKeys,
  scorePsychosophyJourneyModule,
} from "@/lib/scoring/modules/psychosophy";
import {
  scoreSocionicsTypeModule,
  socionicsTypeConstructKeys,
} from "@/lib/scoring/modules/socionics";
import { scoreTraitProfileJourneyModule } from "@/lib/scoring/modules/trait-profile";
import { scoreType16Module, type16ConstructKeys } from "@/lib/scoring/modules/type16";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";
import { traitKeys } from "@/lib/scoring/profile";
import type { ModuleScoringAnswer } from "@/lib/scoring/quality";

/**
 * Real engines, not fixtures.
 *
 * The whole point of the legend is that it agrees with the code the engines
 * produced, so a hand-written module result would test nothing: it could satisfy
 * the legend while the engine disagreed. These helpers therefore drive the actual
 * scoring functions and hand their output straight to the legend.
 */
type PairValue = 1 | 2 | 3 | 4 | 5;

const fallbackValues = [1, 2, 3, 4, 5] as const satisfies readonly PairValue[];

function answers<ConstructKey extends string>(
  keys: readonly ConstructKey[],
  values: Readonly<Partial<Record<ConstructKey, PairValue>>> = {} as Partial<
    Record<ConstructKey, PairValue>
  >,
  perKey = 6,
): ModuleScoringAnswer<ConstructKey>[] {
  return keys.flatMap((constructKey, keyIndex) =>
    Array.from({ length: perKey }, (_, index) => ({
      constructKey,
      itemCode: `${constructKey}-${index}`,
      polarity: 1 as const,
      responseTimeMs: 1800,
      value: values[constructKey] ?? fallbackValues[keyIndex % fallbackValues.length]!,
      weight: 1,
    })),
  );
}

function type16(values: Partial<Record<(typeof type16ConstructKeys)[number], 1 | 2 | 3 | 4 | 5>>) {
  const input = answers(type16ConstructKeys, values);
  return scoreType16Module(input, input.length);
}

function socionics(
  values: Partial<Record<(typeof socionicsTypeConstructKeys)[number], 1 | 2 | 3 | 4 | 5>>,
) {
  const input = answers(socionicsTypeConstructKeys, values);
  return scoreSocionicsTypeModule(input, input.length);
}

function fiveLensModules(): IndependentModuleResult[] {
  const enneagramInput = answers(enneagramJourneyConstructKeys, {
    instinct_self_preservation: 5,
    pattern_1: 5,
    pattern_2: 4,
    pattern_5: 4,
  });
  const traitInput = answers(traitKeys, { openness: 5 });
  const psycheInput = answers(psychosophyConstructKeys, {
    emotion: 1,
    logic: 4,
    physics: 3,
    will: 5,
  });
  return [
    type16({ extraversion: 5, feeling: 5, intuition: 5, judging: 5 }),
    scoreEnneagramJourneyModule(enneagramInput, enneagramInput.length),
    socionics({ extraversion: 1, intuition: 1, logic: 1, rationality: 5 }),
    scoreTraitProfileJourneyModule(traitInput, traitInput.length),
    scorePsychosophyJourneyModule(psycheInput, psycheInput.length),
  ] as IndependentModuleResult[];
}

describe("identity code legend", () => {
  it("explains every segment of the line in printed order", () => {
    const modules = fiveLensModules();
    const identity = buildCollectibleIdentity(modules);
    const legend = buildIdentityCodeLegend(modules, identity);

    // Six segments, matching the six space-separated parts of the line.
    expect(legend).toHaveLength(6);
    expect(identity.line.split(" ")).toHaveLength(6);
    expect(legend.map((segment) => segment.code)).toEqual(identity.line.split(" "));
  });

  /**
   * The invariant that makes the feature trustworthy: the characters the legend
   * explains, joined, must reproduce the code the engine stored. Anything else is
   * an explanation of a code that was never shown.
   */
  it("reproduces every stored code from the characters it explains", () => {
    const modules = fiveLensModules();
    const legend = buildIdentityCodeLegend(modules, buildCollectibleIdentity(modules));

    for (const segment of legend) {
      expect(segment.characters.map((character) => character.glyph).join("")).toBe(segment.code);
      expect(segment.characters.length).toBeGreaterThan(0);
      expect(segment.rule.length).toBeGreaterThan(0);
    }
  });

  it("names a construct and a score for every measured character", () => {
    const modules = fiveLensModules();
    const legend = buildIdentityCodeLegend(modules, buildCollectibleIdentity(modules));
    const measured = legend
      .flatMap((segment) => segment.characters)
      .filter((character) => character.constructKey !== null);

    expect(measured.length).toBeGreaterThan(0);
    for (const character of measured) {
      expect(character.constructLabel).not.toBeNull();
      // Labels are the reader-facing part: a raw key here would put an internal
      // English identifier back on an Indonesian page.
      expect(character.constructLabel).not.toMatch(/_/u);
      expect(character.score).not.toBeNull();
      expect(character.reason).not.toBe("");
    }
  });

  it("marks the trailing group pair as copied, with no score behind it", () => {
    const modules = fiveLensModules();
    const identity = buildCollectibleIdentity(modules);
    const legend = buildIdentityCodeLegend(modules, identity);
    const group = legend.at(-1);

    expect(group?.code).toBe(identity.group);
    expect(group?.characters).toHaveLength(1);
    expect(group?.characters[0]?.score).toBeNull();
    expect(group?.characters[0]?.constructKey).toBeNull();
    // It must say it is not a sixth measurement, or the pair reads as one.
    expect(group?.characters[0]?.reason).toContain(String(identity.type16));
  });

  /**
   * `rationality` prints no letter of its own but reorders the other three, so a
   * naive walk yields the right letters in the wrong order. Both sides of the
   * threshold must still reproduce the engine's own code.
   */
  it("keeps Socionics letters in the order rationality dictates", () => {
    for (const rationality of [5, 1] as const) {
      const lens = socionics({ extraversion: 5, intuition: 5, logic: 1, rationality });
      const identity = buildCollectibleIdentity([lens] as IndependentModuleResult[]);
      const legend = buildIdentityCodeLegend([lens] as IndependentModuleResult[], identity);
      const segment = legend.find((entry) => entry.code === identity.socionics);

      expect(segment).toBeDefined();
      expect(segment?.characters.map((character) => character.glyph).join("")).toBe(
        identity.socionics,
      );
      expect(segment?.rule).toContain("Urutan hurufnya ditentukan");
    }

    // Same three letters, two orders — proof the swap is real and covered.
    const rational = socionics({ extraversion: 5, intuition: 5, logic: 1, rationality: 5 });
    const irrational = socionics({ extraversion: 5, intuition: 5, logic: 1, rationality: 1 });
    const rationalCode = String(rational.summary.primaryType);
    const irrationalCode = String(irrational.summary.primaryType);
    expect(rationalCode).not.toBe(irrationalCode);
    expect([...rationalCode].toSorted()).toEqual([...irrationalCode].toSorted());
  });

  it("omits lenses that did not run instead of filling placeholders", () => {
    const modules = [type16({ extraversion: 5, feeling: 5, intuition: 5, judging: 5 })];
    const identity = buildCollectibleIdentity(modules as IndependentModuleResult[]);
    const legend = buildIdentityCodeLegend(modules as IndependentModuleResult[], identity);

    // Only 16-Type plus the group pair it implies.
    expect(legend.map((segment) => segment.sourceLabel)).toEqual(["16-Type", "Kelompok"]);
    expect(legend.map((segment) => segment.code)).toEqual(identity.line.split(" · "));
    expect(buildIdentityCodeLegend([], buildCollectibleIdentity([]))).toEqual([]);
  });

  it("drops a segment when the stored code and the scores disagree", () => {
    const modules = fiveLensModules();
    const identity = buildCollectibleIdentity(modules);
    // A stored code the scores cannot produce must not be explained.
    const tampered = buildIdentityCodeLegend(modules, { ...identity, type16: "XXXX" });

    expect(tampered.some((segment) => segment.sourceLabel === "16-Type")).toBe(false);
    expect(tampered.some((segment) => segment.code === "XXXX")).toBe(false);
  });
});

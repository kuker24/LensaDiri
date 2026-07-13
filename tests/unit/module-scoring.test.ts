import { describe, expect, it } from "vitest";

import { enneagramConstructKeys, scoreEnneagramModule } from "@/lib/scoring/modules/enneagram";
import { scoreIndependentModule } from "@/lib/scoring/modules/registry";
import {
  scoreTemperamentModule,
  temperamentConstructKeys,
} from "@/lib/scoring/modules/temperament";
import { scoreTraitProfileModule } from "@/lib/scoring/modules/trait-profile";
import { scoreType16Module, type16ConstructKeys } from "@/lib/scoring/modules/type16";
import { traitKeys } from "@/lib/scoring/profile";
import type { ModuleScoringAnswer } from "@/lib/scoring/quality";

function answers<ConstructKey extends string>(
  keys: readonly ConstructKey[],
  values: Readonly<Partial<Record<ConstructKey, number>>> = {} as Partial<
    Record<ConstructKey, number>
  >,
  perKey = 6,
): ModuleScoringAnswer<ConstructKey>[] {
  return keys.flatMap((constructKey, keyIndex) =>
    Array.from({ length: perKey }, (_, index) => ({
      constructKey,
      itemCode: `${constructKey}-${index}`,
      polarity: index === perKey - 1 ? -1 : 1,
      responseTimeMs: 1800,
      value: Math.max(1, Math.min(5, values[constructKey] ?? (keyIndex % 4) + 1)) as
        1 | 2 | 3 | 4 | 5,
      weight: 1,
    })),
  );
}

describe("independent module scoring", () => {
  it("returns modular Trait Profile without legacy derived overlays", () => {
    const input = answers(traitKeys, { openness: 5 });
    const result = scoreTraitProfileModule(input, input.length);

    expect(result.moduleKey).toBe("trait_profile");
    expect(result.scoringVersion).toBe("trait-profile-modular-1");
    expect(result.summary).not.toHaveProperty("overlays");
    expect(result.scores).toHaveLength(5);
  });

  it("scores 16-Type only from its four independent dimensions", () => {
    const input = answers(type16ConstructKeys, {
      extraversion: 5,
      feeling: 5,
      intuition: 5,
      judging: 5,
    });
    const result = scoreType16Module(input, input.length);

    expect(result.summary).toMatchObject({ primaryType: "ENFJ" });
    expect(result.ambiguity).toHaveProperty("alternateType");
    expect(result.scores.map((score) => score.constructKey)).toEqual(type16ConstructKeys);
    expect(JSON.stringify(result)).not.toContain("openness");
  });

  it("scores Enneagram core, adjacent wing, and center from nine own patterns", () => {
    const input = answers(enneagramConstructKeys, {
      pattern_4: 4,
      pattern_5: 5,
      pattern_6: 3,
    });
    const result = scoreEnneagramModule(input, input.length);

    expect(result.summary).toMatchObject({
      center: "head",
      corePattern: "pattern_5",
      wing: "pattern_4",
    });
    expect(result.scores).toHaveLength(9);
  });

  it("scores temperament primary and secondary from independent items", () => {
    const input = answers(temperamentConstructKeys, {
      choleric: 4,
      melancholic: 3,
      phlegmatic: 2,
      sanguine: 5,
    });
    const result = scoreTemperamentModule(input, input.length);

    expect(result.summary).toMatchObject({ primary: "sanguine", secondary: "choleric" });
    expect(result.scores).toHaveLength(4);
  });

  it("is deterministic and registry rejects missing engines", () => {
    const input = answers(type16ConstructKeys, { extraversion: 5 });
    expect(scoreType16Module(input, input.length)).toEqual(scoreType16Module(input, input.length));
    expect(
      scoreIndependentModule({
        answers: input,
        expectedAnswers: input.length,
        moduleKey: "type_16",
      }),
    ).toEqual(scoreType16Module(input, input.length));
    expect(() =>
      scoreIndependentModule({
        answers: input,
        expectedAnswers: input.length,
        moduleKey: "riasec",
      }),
    ).toThrow("No independent scoring engine for riasec");
  });

  it("keeps confidence separate and flags low-quality responses", () => {
    const lowQuality = answers(type16ConstructKeys, {}, 6).map((answer) => ({
      ...answer,
      responseTimeMs: 300,
      value: 3 as const,
    }));
    const result = scoreType16Module(lowQuality, lowQuality.length);

    expect(result.quality.flags).toEqual(
      expect.arrayContaining([
        "clarifier_recommended",
        "excessive_midpoint",
        "low_variance",
        "straightlining",
        "threshold_ambiguity",
        "too_fast",
      ]),
    );
    expect(result.confidence).toBe(result.quality.confidence);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("marks incomplete module coverage rather than fabricating confidence", () => {
    const partial = answers(type16ConstructKeys, {}, 3);
    const result = scoreType16Module(partial, 32);

    expect(result.quality.completion).toBeLessThan(1);
    expect(result.quality.flags).toEqual(
      expect.arrayContaining(["incomplete", "low_module_coverage", "clarifier_recommended"]),
    );
  });
});

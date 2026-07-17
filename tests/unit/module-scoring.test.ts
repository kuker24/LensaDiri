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
import {
  assessModuleQuality,
  resolveQualityModelVersion,
  type ModuleScoringAnswer,
  type QualityModelContext,
} from "@/lib/scoring/quality";

type PairValue = 1 | 2 | 3 | 4 | 5;

function pairAnswer(
  constructKey: string,
  polarity: 1 | -1,
  value: PairValue,
  index: number,
): ModuleScoringAnswer {
  return {
    constructKey,
    itemCode: `${constructKey}-${polarity === -1 ? "r" : "f"}-${index}`,
    polarity,
    responseTimeMs: 1800,
    value,
    weight: 1,
  };
}

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

  it("dispatches independent engines by locked module key and scoring version", () => {
    const type16Input = answers(type16ConstructKeys, { extraversion: 5 });
    expect(scoreType16Module(type16Input, type16Input.length)).toEqual(
      scoreType16Module(type16Input, type16Input.length),
    );
    expect(
      scoreIndependentModule({
        answers: type16Input,
        expectedAnswers: type16Input.length,
        moduleKey: "type_16",
        scoringVersion: "type16-score-1",
      }),
    ).toEqual(scoreType16Module(type16Input, type16Input.length));

    const traitInput = answers(traitKeys, { openness: 5 });
    expect(
      scoreIndependentModule({
        answers: traitInput,
        expectedAnswers: traitInput.length,
        moduleKey: "trait_profile",
        scoringVersion: "trait-profile-modular-1",
      }),
    ).toMatchObject({
      moduleKey: "trait_profile",
      scoringVersion: "trait-profile-modular-1",
    });
    expect(() =>
      scoreIndependentModule({
        answers: traitInput,
        expectedAnswers: traitInput.length,
        moduleKey: "trait_profile",
        scoringVersion: "trait-profile-mvp-1",
      }),
    ).toThrow("No independent scoring engine for trait_profile@trait-profile-mvp-1");
    expect(() =>
      scoreIndependentModule({
        answers: traitInput,
        expectedAnswers: traitInput.length,
        moduleKey: "trait_profile",
        scoringVersion: "trait-profile-unknown-1",
      }),
    ).toThrow("No independent scoring engine for trait_profile@trait-profile-unknown-1");
    expect(() =>
      scoreIndependentModule({
        answers: type16Input,
        expectedAnswers: type16Input.length,
        moduleKey: "riasec",
        scoringVersion: "riasec-score-1",
      }),
    ).toThrow("No independent scoring engine for riasec@riasec-score-1");
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

describe("contradiction-pair detection (PRD §15.4)", () => {
  it("keeps contradictionRate at zero when forward and reverse items agree", () => {
    // Forward answers 5 ("sesuai"), reverse answers 1 ("tidak sesuai").
    // After reverse coding both point to 5, so the pair is consistent.
    const consistent = [
      pairAnswer("focus", 1, 5, 0),
      pairAnswer("focus", 1, 5, 1),
      pairAnswer("focus", -1, 1, 0),
      pairAnswer("focus", -1, 1, 1),
    ];
    const quality = assessModuleQuality({
      ambiguity: 0.1,
      answers: consistent,
      dimensionCoverage: 1,
      expectedAnswers: consistent.length,
      reverseConsistency: 1,
    });

    expect(quality.contradictionRate).toBe(0);
    expect(quality.flags).not.toContain("inconsistent_pair");
  });

  it("flags inconsistent_pair and lowers confidence when a pair contradicts", () => {
    // Forward answers 5 and reverse also answers 5. After reverse coding the
    // reverse item points to 1 while the forward points to 5: a contradiction.
    const contradictory = [
      pairAnswer("focus", 1, 5, 0),
      pairAnswer("focus", 1, 5, 1),
      pairAnswer("focus", -1, 5, 0),
      pairAnswer("focus", -1, 5, 1),
    ];
    const contradicted = assessModuleQuality({
      ambiguity: 0.1,
      answers: contradictory,
      dimensionCoverage: 1,
      expectedAnswers: contradictory.length,
      reverseConsistency: 1,
    });
    const clean = assessModuleQuality({
      ambiguity: 0.1,
      answers: [
        pairAnswer("focus", 1, 5, 0),
        pairAnswer("focus", 1, 5, 1),
        pairAnswer("focus", -1, 1, 0),
        pairAnswer("focus", -1, 1, 1),
      ],
      dimensionCoverage: 1,
      expectedAnswers: 4,
      reverseConsistency: 1,
    });

    expect(contradicted.contradictionRate).toBeGreaterThan(0);
    expect(contradicted.flags).toContain("inconsistent_pair");
    expect(contradicted.flags).toContain("clarifier_recommended");
    expect(contradicted.confidence).toBeLessThan(clean.confidence);
  });
});

describe("versioned confidence model (PRD §15.4)", () => {
  // A clean, complete answer set so factor deltas are the only thing that moves
  // confidence between cases.
  const baseAnswers = answers(type16ConstructKeys, {
    extraversion: 5,
    feeling: 4,
    intuition: 2,
    judging: 5,
  });
  const baseInput = {
    ambiguity: 0.1,
    answers: baseAnswers,
    dimensionCoverage: 1,
    expectedAnswers: baseAnswers.length,
    reverseConsistency: 1,
  } as const;

  function confidenceWith(context: QualityModelContext): number {
    return assessModuleQuality({ ...baseInput, context }).confidence;
  }

  it("leaves module-quality-1 numbers identical to the unversioned formula", () => {
    const legacyExplicit = assessModuleQuality({
      ...baseInput,
      context: { qualityModelVersion: "module-quality-1" },
    });
    const legacyImplicit = assessModuleQuality({ ...baseInput });

    expect(legacyExplicit.qualityModelVersion).toBe("module-quality-1");
    expect(legacyImplicit.qualityModelVersion).toBe("module-quality-1");
    // The four new factors are ignored, even when supplied.
    const withFactors = assessModuleQuality({
      ...baseInput,
      context: {
        clarifier: "completed",
        itemQualityWeight: 0.2,
        modeDepth: "deep",
        optionalItems: { answered: 0, expected: 4 },
        qualityModelVersion: "module-quality-1",
      },
    });
    expect(withFactors.confidence).toBe(legacyExplicit.confidence);
  });

  it("stamps the resolved model version on the result", () => {
    const v2 = assessModuleQuality({
      ...baseInput,
      context: { qualityModelVersion: "module-quality-2" },
    });
    expect(v2.qualityModelVersion).toBe("module-quality-2");
  });

  it("lowers confidence for skipped optional items only when optionals exist", () => {
    const base = confidenceWith({ qualityModelVersion: "module-quality-2" });
    const halfSkipped = confidenceWith({
      optionalItems: { answered: 2, expected: 4 },
      qualityModelVersion: "module-quality-2",
    });
    const noOptional = confidenceWith({
      optionalItems: { answered: 0, expected: 0 },
      qualityModelVersion: "module-quality-2",
    });

    expect(halfSkipped).toBeLessThan(base);
    expect(noOptional).toBe(base);
  });

  it("rewards a completed clarifier over a skipped one", () => {
    const completed = confidenceWith({
      clarifier: "completed",
      qualityModelVersion: "module-quality-2",
    });
    const skipped = confidenceWith({
      clarifier: "skipped",
      qualityModelVersion: "module-quality-2",
    });
    const none = confidenceWith({ clarifier: "none", qualityModelVersion: "module-quality-2" });

    expect(completed).toBeGreaterThan(none);
    expect(skipped).toBeLessThan(none);
    expect(completed).toBeGreaterThan(skipped);
  });

  it("scales confidence down as server-authoritative item weight falls", () => {
    const fullWeight = confidenceWith({
      itemQualityWeight: 1,
      qualityModelVersion: "module-quality-2",
    });
    const lowWeight = confidenceWith({
      itemQualityWeight: 0.4,
      qualityModelVersion: "module-quality-2",
    });

    expect(lowWeight).toBeLessThan(fullWeight);
  });

  it("gives deeper modes a deterministic depth bonus", () => {
    const quick = confidenceWith({ modeDepth: "quick", qualityModelVersion: "module-quality-2" });
    const standard = confidenceWith({
      modeDepth: "standard",
      qualityModelVersion: "module-quality-2",
    });
    const deep = confidenceWith({ modeDepth: "deep", qualityModelVersion: "module-quality-2" });

    expect(standard).toBeGreaterThan(quick);
    expect(deep).toBeGreaterThan(standard);
  });

  it("keeps confidence bounded within [0, 1] under extreme factors", () => {
    const floored = assessModuleQuality({
      ...baseInput,
      ambiguity: 1,
      context: {
        clarifier: "skipped",
        itemQualityWeight: 0,
        optionalItems: { answered: 0, expected: 8 },
        qualityModelVersion: "module-quality-2",
      },
      reverseConsistency: 0,
    }).confidence;
    const ceiled = confidenceWith({
      clarifier: "completed",
      itemQualityWeight: 1,
      modeDepth: "deep",
      qualityModelVersion: "module-quality-2",
    });

    expect(floored).toBeGreaterThanOrEqual(0);
    expect(ceiled).toBeLessThanOrEqual(1);
  });

  it("replays identical output for identical input and version", () => {
    const context: QualityModelContext = {
      clarifier: "completed",
      itemQualityWeight: 0.8,
      modeDepth: "deep",
      optionalItems: { answered: 3, expected: 4 },
      qualityModelVersion: "module-quality-2",
    };
    const first = assessModuleQuality({ ...baseInput, context });
    const second = assessModuleQuality({ ...baseInput, context });

    expect(second).toEqual(first);
  });

  it("resolves stored version and fails closed on an unknown one", () => {
    expect(resolveQualityModelVersion(null)).toBe("module-quality-1");
    expect(resolveQualityModelVersion(undefined)).toBe("module-quality-1");
    expect(resolveQualityModelVersion("module-quality-2")).toBe("module-quality-2");
    expect(() => resolveQualityModelVersion("module-quality-99")).toThrow(
      "Unknown quality model version",
    );
  });
});

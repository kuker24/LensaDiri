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
    // Verify all 6 newly registered engines resolve and score with compatible answers.
    const riasecInput = answers(
      ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"],
      { realistic: 3, investigative: 4, artistic: 2, social: 3, enterprising: 4, conventional: 3 },
    );
    expect(
      scoreIndependentModule({
        answers: riasecInput,
        expectedAnswers: riasecInput.length,
        moduleKey: "riasec",
        scoringVersion: "riasec-score-1",
      }),
    ).toMatchObject({
      moduleKey: "riasec",
      scoringVersion: "riasec-score-1",
    });

    const instinctInput = answers(["self_preservation", "social", "one_to_one"], {
      self_preservation: 4,
      social: 3,
      one_to_one: 2,
    });
    expect(
      scoreIndependentModule({
        answers: instinctInput,
        expectedAnswers: instinctInput.length,
        moduleKey: "instinct",
        scoringVersion: "instinct-score-1",
      }),
    ).toMatchObject({
      moduleKey: "instinct",
      scoringVersion: "instinct-score-1",
    });

    const threeCenterInput = answers(["head", "heart", "gut"], { head: 3, heart: 4, gut: 2 });
    expect(
      scoreIndependentModule({
        answers: threeCenterInput,
        expectedAnswers: threeCenterInput.length,
        moduleKey: "three_center",
        scoringVersion: "three-center-score-1",
      }),
    ).toMatchObject({
      moduleKey: "three_center",
      scoringVersion: "three-center-score-1",
    });

    const attachmentInput = answers(["secure", "anxious", "avoidant", "fearful"], {
      secure: 4,
      anxious: 3,
      avoidant: 2,
      fearful: 2,
    });
    expect(
      scoreIndependentModule({
        answers: attachmentInput,
        expectedAnswers: attachmentInput.length,
        moduleKey: "attachment",
        scoringVersion: "attachment-score-1",
      }),
    ).toMatchObject({
      moduleKey: "attachment",
      scoringVersion: "attachment-score-1",
    });

    const socionicsInput = answers(["information_processing", "interaction_style"], {
      information_processing: 4,
      interaction_style: 3,
    });
    expect(
      scoreIndependentModule({
        answers: socionicsInput,
        expectedAnswers: socionicsInput.length,
        moduleKey: "socionics_communication",
        scoringVersion: "socionics-score-1",
      }),
    ).toMatchObject({
      moduleKey: "socionics_communication",
      scoringVersion: "socionics-score-1",
    });

    const psychosophyInput = answers(["emotion", "will", "logic", "physics"], {
      emotion: 4,
      will: 3,
      logic: 3,
      physics: 2,
    });
    expect(
      scoreIndependentModule({
        answers: psychosophyInput,
        expectedAnswers: psychosophyInput.length,
        moduleKey: "psychosophy",
        scoringVersion: "psychosophy-score-1",
      }),
    ).toMatchObject({
      moduleKey: "psychosophy",
      scoringVersion: "psychosophy-score-1",
    });
    // Unknown engine still throws.
    expect(() =>
      scoreIndependentModule({
        answers: type16Input,
        expectedAnswers: type16Input.length,
        moduleKey: "unknown_module",
        scoringVersion: "unknown-score-1",
      }),
    ).toThrow("No independent scoring engine for unknown_module@unknown-score-1");
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

const MODEL2 = { qualityModelVersion: "module-quality-2" } as const;

describe("contradiction-pair detection (PRD §15.4, module-quality-2)", () => {
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
      context: MODEL2,
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
      context: MODEL2,
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
      context: MODEL2,
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

// Frozen fixtures: confidence and flags captured from the assessModuleQuality
// formula at main d7b2c40 (before any contradiction-pair or versioned factor).
// These do NOT compare the new code to itself; they pin absolute values so a
// module-quality-1 regression is caught even if both paths change together.
describe("module-quality-1 frozen regression (d7b2c40)", () => {
  // A contradictory forward/reverse pair. Under d7b2c40 there was no pair logic,
  // so confidence is high (0.98) and no inconsistent_pair flag exists.
  const contradictory = [
    pairAnswer("focus", 1, 5, 0),
    pairAnswer("focus", 1, 5, 1),
    pairAnswer("focus", -1, 5, 0),
    pairAnswer("focus", -1, 5, 1),
  ];
  const contradictoryInput = {
    ambiguity: 0.1,
    answers: contradictory,
    dimensionCoverage: 1,
    expectedAnswers: contradictory.length,
    reverseConsistency: 1,
  } as const;

  // Eight fast midpoint responses trip most legacy flags at once.
  const rich = Array.from({ length: 8 }, (_, index) => ({
    constructKey: "focus",
    itemCode: `f-${index}`,
    polarity: 1 as const,
    responseTimeMs: 300,
    value: 3 as const,
    weight: 1,
  }));
  const richInput = {
    ambiguity: 0.8,
    answers: rich,
    dimensionCoverage: 1,
    expectedAnswers: 8,
    reverseConsistency: 1,
  } as const;

  it("matches the frozen d7b2c40 confidence and flags for a contradictory pair", () => {
    // Implicit (no context) and explicit module-quality-1 must both be legacy.
    for (const context of [undefined, { qualityModelVersion: "module-quality-1" as const }]) {
      const quality = assessModuleQuality({ ...contradictoryInput, context });
      expect(quality.confidence).toBe(0.98);
      expect(quality.flags).toEqual([]);
      expect(quality.contradictionRate).toBe(0);
      expect(quality.flags).not.toContain("inconsistent_pair");
    }
  });

  it("matches the frozen d7b2c40 confidence and flags for a multi-flag response", () => {
    const quality = assessModuleQuality({
      ...richInput,
      context: { qualityModelVersion: "module-quality-1" },
    });
    expect(quality.confidence).toBe(0.12);
    expect(quality.flags).toEqual([
      "clarifier_recommended",
      "excessive_midpoint",
      "low_variance",
      "straightlining",
      "threshold_ambiguity",
      "too_fast",
    ]);
  });

  it("keeps module-quality-1 free of contradiction penalty and flag", () => {
    // Same contradictory input: v1 stays at the frozen 0.98, v2 drops and flags.
    const v1 = assessModuleQuality({
      ...contradictoryInput,
      context: { qualityModelVersion: "module-quality-1" },
    });
    const v2 = assessModuleQuality({ ...contradictoryInput, context: MODEL2 });

    expect(v1.confidence).toBe(0.98);
    expect(v1.flags).not.toContain("inconsistent_pair");
    expect(v2.flags).toContain("inconsistent_pair");
    expect(v2.confidence).toBeLessThan(v1.confidence);
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

  it("ignores every module-quality-2 factor under module-quality-1", () => {
    const legacyExplicit = assessModuleQuality({
      ...baseInput,
      context: { qualityModelVersion: "module-quality-1" },
    });
    const legacyImplicit = assessModuleQuality({ ...baseInput });

    expect(legacyExplicit.qualityModelVersion).toBe("module-quality-1");
    expect(legacyImplicit.qualityModelVersion).toBe("module-quality-1");
    expect(legacyImplicit.confidence).toBe(legacyExplicit.confidence);
    // The four new factors are ignored, even when supplied. A default v2 run on
    // the same clean input applies the deltas and diverges, proving the gate.
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
    const sameFactorsV2 = assessModuleQuality({
      ...baseInput,
      context: {
        clarifier: "completed",
        itemQualityWeight: 0.2,
        modeDepth: "deep",
        optionalItems: { answered: 0, expected: 4 },
        qualityModelVersion: "module-quality-2",
      },
    });
    expect(sameFactorsV2.confidence).not.toBe(legacyExplicit.confidence);
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

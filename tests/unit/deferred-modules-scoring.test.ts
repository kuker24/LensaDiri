import { describe, expect, it } from "vitest";

import { attachmentConstructKeys, scoreAttachmentModule } from "@/lib/scoring/modules/attachment";
import { instinctConstructKeys, scoreInstinctModule } from "@/lib/scoring/modules/instinct";
import {
  psychosophyConstructKeys,
  scorePsychosophyModule,
} from "@/lib/scoring/modules/psychosophy";
import { riasecConstructKeys, scoreRiasecModule } from "@/lib/scoring/modules/riasec";
import { scoreIndependentModule } from "@/lib/scoring/modules/registry";
import { socionicsConstructKeys, scoreSocionicsModule } from "@/lib/scoring/modules/socionics";
import {
  scoreThreeCenterModule,
  threeCenterConstructKeys,
} from "@/lib/scoring/modules/three-center";
import type { ModuleScoringAnswer } from "@/lib/scoring/quality";

type PairValue = 1 | 2 | 3 | 4 | 5;

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
      value: Math.max(1, Math.min(5, values[constructKey] ?? (keyIndex % 4) + 1)) as PairValue,
      weight: 1,
    })),
  );
}

describe("three-center independent scoring", () => {
  it("scores head, heart, gut from own items and identifies dominant center", () => {
    const input = answers(threeCenterConstructKeys, { head: 5, heart: 4, gut: 2 });
    const result = scoreThreeCenterModule(input, input.length);

    expect(result.moduleKey).toBe("three_center");
    expect(result.scoringVersion).toBe("three-center-score-1");
    expect(result.scores).toHaveLength(3);
    expect(result.summary.primaryCenter).toBe("head");
    expect(result.scores.map((score) => score.constructKey)).toEqual(threeCenterConstructKeys);
  });
});

describe("instinct independent scoring", () => {
  it("scores three instinct variants and picks dominant", () => {
    const input = answers(instinctConstructKeys, {
      self_preservation: 5,
      social: 3,
      one_to_one: 2,
    });
    const result = scoreInstinctModule(input, input.length);

    expect(result.moduleKey).toBe("instinct");
    expect(result.scoringVersion).toBe("instinct-score-1");
    expect(result.scores).toHaveLength(3);
    expect(result.summary.primaryVariant).toBe("self_preservation");
    expect(result.scores.map((score) => score.constructKey)).toEqual(instinctConstructKeys);
  });
});

describe("riasec independent scoring", () => {
  it("scores six career interest dimensions and orders them", () => {
    const input = answers(riasecConstructKeys, {
      realistic: 5,
      investigative: 4,
      artistic: 3,
      social: 2,
      enterprising: 3,
      conventional: 1,
    });
    const result = scoreRiasecModule(input, input.length);

    expect(result.moduleKey).toBe("riasec");
    expect(result.scoringVersion).toBe("riasec-score-1");
    expect(result.scores).toHaveLength(6);
    expect(result.summary.hollandCode).toContain("R");
    expect(result.summary.topInterests).toBeDefined();
    expect(result.scores.map((score) => score.constructKey)).toEqual(riasecConstructKeys);
  });
});

describe("attachment independent scoring", () => {
  it("scores four patterns and identifies dominant", () => {
    const input = answers(attachmentConstructKeys, {
      secure: 5,
      anxious: 3,
      avoidant: 2,
      fearful: 2,
    });
    const result = scoreAttachmentModule(input, input.length);

    expect(result.moduleKey).toBe("attachment");
    expect(result.scoringVersion).toBe("attachment-score-1");
    expect(result.scores).toHaveLength(4);
    expect(result.summary.dominantPattern).toBe("secure");
    expect(result.scores.map((score) => score.constructKey)).toEqual(attachmentConstructKeys);
  });
});

describe("psychosophy independent scoring", () => {
  it("scores four functions and orders them", () => {
    const input = answers(psychosophyConstructKeys, {
      emotion: 5,
      will: 4,
      logic: 3,
      physics: 2,
    });
    const result = scorePsychosophyModule(input, input.length);

    expect(result.moduleKey).toBe("psychosophy");
    expect(result.scoringVersion).toBe("psychosophy-score-1");
    expect(result.scores).toHaveLength(4);
    expect(result.summary).toMatchObject({ priorityOrder: expect.arrayContaining(["emotion"]) });
    expect(result.scores.map((score) => score.constructKey)).toEqual(psychosophyConstructKeys);
  });
});

describe("socionics communication independent scoring", () => {
  it("scores two styles and identifies orientation", () => {
    const input = answers(socionicsConstructKeys, {
      information_processing: 5,
      interaction_style: 3,
    });
    const result = scoreSocionicsModule(input, input.length);

    expect(result.moduleKey).toBe("socionics_communication");
    expect(result.scoringVersion).toBe("socionics-score-1");
    expect(result.scores).toHaveLength(2);
    expect(result.scores.map((score) => score.constructKey)).toEqual(socionicsConstructKeys);
  });
});

describe("deferred module registry provenance", () => {
  it("registers all six deferred engines with locked module key + scoring version", () => {
    const cases: ReadonlyArray<{
      moduleKey: string;
      scoringVersion: string;
      constructKeys: readonly string[];
      answers: ModuleScoringAnswer[];
    }> = [
      {
        moduleKey: "three_center",
        scoringVersion: "three-center-score-1",
        constructKeys: threeCenterConstructKeys,
        answers: answers(threeCenterConstructKeys, { head: 4 }),
      },
      {
        moduleKey: "instinct",
        scoringVersion: "instinct-score-1",
        constructKeys: instinctConstructKeys,
        answers: answers(instinctConstructKeys, { self_preservation: 4 }),
      },
      {
        moduleKey: "riasec",
        scoringVersion: "riasec-score-1",
        constructKeys: riasecConstructKeys,
        answers: answers(riasecConstructKeys, { realistic: 4 }),
      },
      {
        moduleKey: "attachment",
        scoringVersion: "attachment-score-1",
        constructKeys: attachmentConstructKeys,
        answers: answers(attachmentConstructKeys, { secure: 4 }),
      },
      {
        moduleKey: "psychosophy",
        scoringVersion: "psychosophy-score-1",
        constructKeys: psychosophyConstructKeys,
        answers: answers(psychosophyConstructKeys, { emotion: 4 }),
      },
      {
        moduleKey: "socionics_communication",
        scoringVersion: "socionics-score-1",
        constructKeys: socionicsConstructKeys,
        answers: answers(socionicsConstructKeys, { information_processing: 4 }),
      },
    ];

    for (const testCase of cases) {
      const result = scoreIndependentModule({
        answers: testCase.answers as ModuleScoringAnswer[],
        expectedAnswers: testCase.answers.length,
        moduleKey: testCase.moduleKey,
        scoringVersion: testCase.scoringVersion,
      });
      expect(result.moduleKey).toBe(testCase.moduleKey);
      expect(result.scoringVersion).toBe(testCase.scoringVersion);
      expect(result.scores.map((score) => score.constructKey)).toEqual([...testCase.constructKeys]);
    }
  });

  it("fails closed when a deferred module is requested with unknown scoring version", () => {
    const input = answers(threeCenterConstructKeys, { head: 4 });
    expect(() =>
      scoreIndependentModule({
        answers: input as ModuleScoringAnswer[],
        expectedAnswers: input.length,
        moduleKey: "three_center",
        scoringVersion: "three-center-unknown-1",
      }),
    ).toThrow("No independent scoring engine for three_center@three-center-unknown-1");
  });
});

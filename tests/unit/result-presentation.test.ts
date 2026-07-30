import { describe, expect, it } from "vitest";

import {
  ambiguityReading,
  confidenceReading,
  formatModuleResultTitle,
  formatResultKey,
  orderResultScores,
  scoreReading,
} from "@/lib/report/result-presentation";

describe("result presentation", () => {
  it("turns every modular summary shape into a human-readable headline", () => {
    expect(formatModuleResultTitle("type_16", { primaryType: "INFJ" })).toBe("INFJ");
    expect(
      formatModuleResultTitle("enneagram", { corePattern: "pattern_6", wing: "pattern_5" }),
    ).toBe("Pola 6w5");
    expect(
      formatModuleResultTitle("temperament", {
        primary: "melancholic",
        secondary: "phlegmatic",
      }),
    ).toBe("Melankolis + Plegmatis");
    expect(formatModuleResultTitle("riasec", { hollandCode: "AIC" })).toBe("AIC");
    expect(formatModuleResultTitle("attachment", { dominantPattern: "anxious" })).toBe(
      "Cemas dalam relasi",
    );
    expect(formatModuleResultTitle("instinct", { primaryVariant: "self_preservation" })).toBe(
      "Keamanan diri",
    );
    expect(formatModuleResultTitle("three_center", { primaryCenter: "gut" })).toBe(
      "Perut / insting",
    );
    expect(formatModuleResultTitle("trait_profile", { archetype: "eksploratif" })).toBe(
      "Eksploratif",
    );
    expect(
      formatModuleResultTitle("socionics_communication", {
        communicationPattern: "abstrak-asosiatif · menginisiasi",
      }),
    ).toBe("Abstrak-asosiatif · menginisiasi");
    expect(
      formatModuleResultTitle("psychosophy", {
        priorityOrder: ["physics", "will", "logic", "emotion"],
      }),
    ).toBe("Kebutuhan fisik > Kehendak dan aksi");
  });

  it("never invents tritype or absent derived labels", () => {
    const title = formatModuleResultTitle("enneagram", {
      corePattern: "pattern_6",
      wing: "pattern_5",
    });

    expect(title).toBe("Pola 6w5");
    expect(title).not.toMatch(/459|tritype/iu);
  });

  it("uses words before numbers and translates internal keys", () => {
    expect(scoreReading(76)).toBe("Menonjol");
    expect(scoreReading(50)).toBe("Cukup seimbang");
    expect(scoreReading(25)).toBe("Kurang menonjol");
    expect(confidenceReading(0.82)).toBe("Dukungan kuat");
    expect(confidenceReading(0.68)).toBe("Cukup terbaca");
    expect(confidenceReading(0.46)).toBe("Perlu konteks");
    expect(confidenceReading(0.36)).toBe("Baca hati-hati");
    expect(ambiguityReading(0.75)).toMatch(/hampir sama kuat/iu);
    expect(formatResultKey("pattern_6")).toBe("Pola 6");
    expect(formatResultKey("one_to_one")).toBe("Kedekatan satu-ke-satu");
  });

  it("keeps bipolar axes stable and ranks composition scores", () => {
    const scores = [
      { constructKey: "pattern_1", normalizedScore: 50 },
      { constructKey: "pattern_6", normalizedScore: 75 },
      { constructKey: "pattern_2", normalizedScore: 62 },
    ];

    expect(orderResultScores("type_16", scores)).toEqual(scores);
    expect(orderResultScores("enneagram", scores).map((score) => score.constructKey)).toEqual([
      "pattern_6",
      "pattern_2",
      "pattern_1",
    ]);
  });
});

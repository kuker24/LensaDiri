import { describe, expect, it } from "vitest";

import { scoreProfile, traitKeys, type ProfileAnswer } from "@/lib/scoring/profile";

function profileAnswers(value: 1 | 2 | 3 | 4 | 5, count = 8): ProfileAnswer[] {
  return traitKeys.flatMap((constructKey) =>
    Array.from({ length: count }, (_, index) => ({
      constructKey,
      polarity: index % 2 === 0 ? (1 as const) : (-1 as const),
      value,
      weight: 1,
    })),
  );
}

describe("MVP trait profile scoring", () => {
  it("is deterministic, bounded, and reports response quality", () => {
    const input = profileAnswers(5);
    const first = scoreProfile(input);
    const second = scoreProfile(input);

    expect(first).toEqual(second);
    expect(first.scoringVersion).toBe("trait-profile-mvp-1");
    expect(first.quality).toEqual({
      answeredItems: 40,
      confidence: 0.6667,
      straightLineWarning: true,
    });
    expect(first.scores).toHaveLength(5);
    expect(first.scores.every((score) => score.normalizedScore === 50)).toBe(true);
    expect(first.summary.overlays).toEqual({
      motivation: expect.objectContaining({ label: "Pola 5w4 · pemahaman" }),
      temperament: expect.objectContaining({ label: "Ekspresif-peka" }),
      type16: expect.objectContaining({ label: "ENFJ" }),
    });
  });

  it("requires every trait dimension", () => {
    expect(() =>
      scoreProfile(profileAnswers(3).filter((answer) => answer.constructKey !== "openness")),
    ).toThrow("Missing responses for openness.");
  });
});

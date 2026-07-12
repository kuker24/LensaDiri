import { describe, expect, it } from "vitest";
import { normalizeLikertAverage, reverseLikert, scoreWeightedLikert } from "@/lib/scoring/likert";

describe("Likert scoring", () => {
  it("reverse-codes a five-point response", () => {
    expect(reverseLikert(1)).toBe(5);
    expect(reverseLikert(3)).toBe(3);
    expect(reverseLikert(5)).toBe(1);
  });

  it("normalizes the Likert range to zero through one hundred", () => {
    expect(normalizeLikertAverage(1)).toBe(0);
    expect(normalizeLikertAverage(3)).toBe(50);
    expect(normalizeLikertAverage(5)).toBe(100);
  });

  it("scores weighted positive and reverse-coded items deterministically", () => {
    expect(
      scoreWeightedLikert([
        { value: 5, polarity: 1, weight: 2 },
        { value: 1, polarity: -1, weight: 1 },
        { value: 3, polarity: 1 },
      ]),
    ).toEqual({
      weightedAverage: 4.5,
      normalizedScore: 87.5,
      answeredItems: 3,
      totalWeight: 4,
    });
  });

  it("rejects an empty response set", () => {
    expect(() => scoreWeightedLikert([])).toThrow("At least one response is required");
  });
});

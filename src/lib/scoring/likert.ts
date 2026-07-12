export type LikertValue = 1 | 2 | 3 | 4 | 5;
export type ItemPolarity = 1 | -1;

export interface WeightedLikertResponse {
  value: LikertValue;
  polarity: ItemPolarity;
  weight?: number;
}

export interface DimensionScore {
  weightedAverage: number;
  normalizedScore: number;
  answeredItems: number;
  totalWeight: number;
}

function assertLikertValue(value: number): asserts value is LikertValue {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new RangeError("Likert value must be an integer from 1 to 5.");
  }
}

export function reverseLikert(value: LikertValue): LikertValue {
  assertLikertValue(value);
  return (6 - value) as LikertValue;
}

export function normalizeLikertAverage(average: number): number {
  if (!Number.isFinite(average) || average < 1 || average > 5) {
    throw new RangeError("Likert average must be between 1 and 5.");
  }

  return Number((((average - 1) / 4) * 100).toFixed(2));
}

export function scoreWeightedLikert(responses: readonly WeightedLikertResponse[]): DimensionScore {
  if (responses.length === 0) {
    throw new RangeError("At least one response is required.");
  }

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const response of responses) {
    assertLikertValue(response.value);

    if (response.polarity !== 1 && response.polarity !== -1) {
      throw new RangeError("Item polarity must be 1 or -1.");
    }

    const weight = response.weight ?? 1;
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new RangeError("Item weight must be a positive finite number.");
    }

    const scoredValue = response.polarity === -1 ? reverseLikert(response.value) : response.value;
    weightedTotal += scoredValue * weight;
    totalWeight += weight;
  }

  const weightedAverage = weightedTotal / totalWeight;

  return {
    weightedAverage: Number(weightedAverage.toFixed(4)),
    normalizedScore: normalizeLikertAverage(weightedAverage),
    answeredItems: responses.length,
    totalWeight: Number(totalWeight.toFixed(4)),
  };
}

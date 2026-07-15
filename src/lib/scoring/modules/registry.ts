import { scoreEnneagramModule, type EnneagramConstructKey } from "@/lib/scoring/modules/enneagram";
import {
  scoreTemperamentModule,
  type TemperamentConstructKey,
} from "@/lib/scoring/modules/temperament";
import { scoreTraitProfileModule } from "@/lib/scoring/modules/trait-profile";
import { scoreType16Module, type Type16ConstructKey } from "@/lib/scoring/modules/type16";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";
import type { TraitKey } from "@/lib/scoring/profile";
import type { ModuleScoringAnswer } from "@/lib/scoring/quality";

export const independentScoringVersions = {
  enneagram: "enneagram-score-1",
  temperament: "temperament-score-1",
  trait_profile: "trait-profile-modular-1",
  type_16: "type16-score-1",
} as const;

export const independentlyScoredModuleKeys = Object.keys(
  independentScoringVersions,
) as (keyof typeof independentScoringVersions)[];
export type IndependentlyScoredModuleKey = (typeof independentlyScoredModuleKeys)[number];

type IndependentScoringInput = {
  readonly answers: readonly ModuleScoringAnswer[];
  readonly expectedAnswers: number;
};

type IndependentScoringEngine = (input: IndependentScoringInput) => IndependentModuleResult;

const independentScoringRegistry = new Map<string, IndependentScoringEngine>([
  [
    "trait_profile@trait-profile-modular-1",
    ({ answers, expectedAnswers }) =>
      scoreTraitProfileModule(answers as readonly ModuleScoringAnswer<TraitKey>[], expectedAnswers),
  ],
  [
    "type_16@type16-score-1",
    ({ answers, expectedAnswers }) =>
      scoreType16Module(
        answers as readonly ModuleScoringAnswer<Type16ConstructKey>[],
        expectedAnswers,
      ),
  ],
  [
    "enneagram@enneagram-score-1",
    ({ answers, expectedAnswers }) =>
      scoreEnneagramModule(
        answers as readonly ModuleScoringAnswer<EnneagramConstructKey>[],
        expectedAnswers,
      ),
  ],
  [
    "temperament@temperament-score-1",
    ({ answers, expectedAnswers }) =>
      scoreTemperamentModule(
        answers as readonly ModuleScoringAnswer<TemperamentConstructKey>[],
        expectedAnswers,
      ),
  ],
]);

export function scoreIndependentModule(input: {
  readonly answers: readonly ModuleScoringAnswer[];
  readonly expectedAnswers: number;
  readonly moduleKey: string;
  readonly scoringVersion: string;
}): IndependentModuleResult {
  const registryKey = `${input.moduleKey}@${input.scoringVersion}`;
  const engine = independentScoringRegistry.get(registryKey);
  if (!engine) {
    throw new RangeError(`No independent scoring engine for ${registryKey}.`);
  }
  const result = engine(input);
  if (result.moduleKey !== input.moduleKey || result.scoringVersion !== input.scoringVersion) {
    throw new RangeError(`Scoring engine provenance mismatch for ${registryKey}.`);
  }
  return result;
}

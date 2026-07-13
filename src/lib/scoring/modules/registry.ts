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

export const independentlyScoredModuleKeys = [
  "trait_profile",
  "type_16",
  "enneagram",
  "temperament",
] as const;
export type IndependentlyScoredModuleKey = (typeof independentlyScoredModuleKeys)[number];

export function scoreIndependentModule(input: {
  readonly answers: readonly ModuleScoringAnswer[];
  readonly expectedAnswers: number;
  readonly moduleKey: string;
}): IndependentModuleResult {
  if (input.moduleKey === "trait_profile") {
    return scoreTraitProfileModule(
      input.answers as readonly ModuleScoringAnswer<TraitKey>[],
      input.expectedAnswers,
    );
  }
  if (input.moduleKey === "type_16") {
    return scoreType16Module(
      input.answers as readonly ModuleScoringAnswer<Type16ConstructKey>[],
      input.expectedAnswers,
    );
  }
  if (input.moduleKey === "enneagram") {
    return scoreEnneagramModule(
      input.answers as readonly ModuleScoringAnswer<EnneagramConstructKey>[],
      input.expectedAnswers,
    );
  }
  if (input.moduleKey === "temperament") {
    return scoreTemperamentModule(
      input.answers as readonly ModuleScoringAnswer<TemperamentConstructKey>[],
      input.expectedAnswers,
    );
  }
  throw new RangeError(`No independent scoring engine for ${input.moduleKey}.`);
}

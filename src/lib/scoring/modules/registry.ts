import {
  scoreAttachmentModule,
  type AttachmentConstructKey,
} from "@/lib/scoring/modules/attachment";
import {
  scoreEnneagramJourneyModule,
  scoreEnneagramModule,
  type EnneagramConstructKey,
  type EnneagramJourneyConstructKey,
} from "@/lib/scoring/modules/enneagram";
import { scoreInstinctModule, type InstinctConstructKey } from "@/lib/scoring/modules/instinct";
import {
  scorePsychosophyJourneyModule,
  scorePsychosophyModule,
  type PsychosophyConstructKey,
} from "@/lib/scoring/modules/psychosophy";
import { scoreRiasecModule, type RiasecConstructKey } from "@/lib/scoring/modules/riasec";
import {
  scoreSocionicsModule,
  scoreSocionicsTypeModule,
  type SocionicsConstructKey,
  type SocionicsTypeConstructKey,
} from "@/lib/scoring/modules/socionics";
import {
  scoreTemperamentModule,
  type TemperamentConstructKey,
} from "@/lib/scoring/modules/temperament";
import {
  scoreThreeCenterModule,
  type ThreeCenterConstructKey,
} from "@/lib/scoring/modules/three-center";
import {
  scoreTraitProfileJourneyModule,
  scoreTraitProfileModule,
} from "@/lib/scoring/modules/trait-profile";
import { scoreType16Module, type Type16ConstructKey } from "@/lib/scoring/modules/type16";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";
import type { TraitKey } from "@/lib/scoring/profile";
import type { ModuleScoringAnswer, QualityModelContext } from "@/lib/scoring/quality";

export const independentScoringVersions = {
  attachment: "attachment-score-1",
  enneagram: "enneagram-score-1",
  instinct: "instinct-score-1",
  psychosophy: "psychosophy-score-1",
  riasec: "riasec-score-1",
  socionics_communication: "socionics-score-1",
  temperament: "temperament-score-1",
  three_center: "three-center-score-1",
  trait_profile: "trait-profile-modular-1",
  type_16: "type16-score-1",
} as const;

export const independentlyScoredModuleKeys = Object.keys(
  independentScoringVersions,
) as (keyof typeof independentScoringVersions)[];
export type IndependentlyScoredModuleKey = (typeof independentlyScoredModuleKeys)[number];

export function hasIndependentScoringEngine(moduleKey: string, scoringVersion: string): boolean {
  return independentScoringRegistry.has(`${moduleKey}@${scoringVersion}`);
}

type IndependentScoringInput = {
  readonly answers: readonly ModuleScoringAnswer[];
  readonly context?: QualityModelContext | undefined;
  readonly expectedAnswers: number;
};

type IndependentScoringEngine = (input: IndependentScoringInput) => IndependentModuleResult;

const independentScoringRegistry = new Map<string, IndependentScoringEngine>([
  [
    "trait_profile@trait-profile-modular-1",
    ({ answers, context, expectedAnswers }) =>
      scoreTraitProfileModule(
        answers as readonly ModuleScoringAnswer<TraitKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "trait_profile@trait-profile-journey-1",
    ({ answers, context, expectedAnswers }) =>
      scoreTraitProfileJourneyModule(
        answers as readonly ModuleScoringAnswer<TraitKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "type_16@type16-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreType16Module(
        answers as readonly ModuleScoringAnswer<Type16ConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "enneagram@enneagram-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreEnneagramModule(
        answers as readonly ModuleScoringAnswer<EnneagramConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "enneagram@enneagram-journey-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreEnneagramJourneyModule(
        answers as readonly ModuleScoringAnswer<EnneagramJourneyConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "temperament@temperament-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreTemperamentModule(
        answers as readonly ModuleScoringAnswer<TemperamentConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "three_center@three-center-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreThreeCenterModule(
        answers as readonly ModuleScoringAnswer<ThreeCenterConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "instinct@instinct-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreInstinctModule(
        answers as readonly ModuleScoringAnswer<InstinctConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "socionics_communication@socionics-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreSocionicsModule(
        answers as readonly ModuleScoringAnswer<SocionicsConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "socionics_communication@socionics-type-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreSocionicsTypeModule(
        answers as readonly ModuleScoringAnswer<SocionicsTypeConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "riasec@riasec-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreRiasecModule(
        answers as readonly ModuleScoringAnswer<RiasecConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "attachment@attachment-score-1",
    ({ answers, context, expectedAnswers }) =>
      scoreAttachmentModule(
        answers as readonly ModuleScoringAnswer<AttachmentConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "psychosophy@psychosophy-score-1",
    ({ answers, context, expectedAnswers }) =>
      scorePsychosophyModule(
        answers as readonly ModuleScoringAnswer<PsychosophyConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
  [
    "psychosophy@psychosophy-journey-score-1",
    ({ answers, context, expectedAnswers }) =>
      scorePsychosophyJourneyModule(
        answers as readonly ModuleScoringAnswer<PsychosophyConstructKey>[],
        expectedAnswers,
        context,
      ),
  ],
]);

/**
 * Every dispatchable `moduleKey@scoringVersion` pair, derived from the registry so
 * operational views cannot drift from what the engine actually accepts.
 * `independentScoringVersions` above stays as the default version per module.
 */
export function listIndependentScoringRegistrations(): readonly Readonly<{
  moduleKey: string;
  scoringVersion: string;
}>[] {
  return [...independentScoringRegistry.keys()]
    .map((registryKey) => {
      const separator = registryKey.lastIndexOf("@");
      return {
        moduleKey: registryKey.slice(0, separator),
        scoringVersion: registryKey.slice(separator + 1),
      };
    })
    .toSorted(
      (left, right) =>
        left.moduleKey.localeCompare(right.moduleKey) ||
        left.scoringVersion.localeCompare(right.scoringVersion),
    );
}

export function scoreIndependentModule(input: {
  readonly answers: readonly ModuleScoringAnswer[];
  readonly context?: QualityModelContext | undefined;
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

import "server-only";

import { createHash } from "node:crypto";

import {
  type ComposedBlueprint,
  type ComposerItemCandidate,
  composeAssessment,
} from "@/lib/assessment/composer";
import type { AssessmentEstimate } from "@/lib/assessment/estimate";
import type { AssessmentSelectionInput } from "@/lib/assessment/catalog";
import { getDatabase, withTransaction } from "@/lib/db/client";
import type { ItemPolarity } from "@/lib/scoring/likert";
import { runDatabaseOperation } from "@/server/database";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function blueprintHash(blueprint: ComposedBlueprint): string {
  return sha256(JSON.stringify(canonicalize(blueprint)));
}

export async function loadComposerCandidates(
  moduleKeys: readonly string[],
): Promise<ComposerItemCandidate[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        clarifier_enabled: boolean;
        consistency_pair_key: string | null;
        construct_key: string;
        dimension_id: string;
        evidence_tier: ComposerItemCandidate["evidenceTier"];
        exposure_group: string | null;
        facet_key: string;
        id: string;
        information_priority: string;
        item_bank_version: string;
        item_code: string;
        minimum_item_coverage: number;
        mode_eligibility: ComposerItemCandidate["modeEligibility"];
        module_key: string;
        module_version_id: string;
        polarity: ItemPolarity;
        report_template_version: string;
        scoring_version: string;
      }[]
    >`
      select
        questions.id,
        questions.item_code,
        questions.mode_eligibility,
        questions.information_priority::text,
        questions.clarifier_enabled,
        questions.exposure_group,
        question_dimensions.id as dimension_id,
        question_dimensions.construct_key,
        question_dimensions.facet_key,
        question_dimensions.minimum_item_coverage,
        question_dimension_mappings.polarity,
        question_dimension_mappings.consistency_pair_key,
        modules.key as module_key,
        modules.evidence_tier,
        module_versions.id as module_version_id,
        module_versions.item_bank_version,
        module_versions.scoring_version,
        module_versions.report_template_version
      from public.modules
      inner join lateral (
        select candidate_versions.*
        from public.module_versions as candidate_versions
        where candidate_versions.module_id = modules.id
          and candidate_versions.status in ('pilot', 'published', 'experimental')
          and candidate_versions.scoring_version = case
            when modules.key = 'trait_profile' then 'trait-profile-modular-1'
            else candidate_versions.scoring_version
          end
        order by candidate_versions.published_at desc nulls last,
          candidate_versions.created_at desc,
          candidate_versions.version desc
        limit 1
      ) as module_versions on true
      inner join public.questions on questions.module_version_id = module_versions.id
      inner join public.question_dimensions on question_dimensions.id = questions.dimension_id
      inner join public.question_dimension_mappings
        on question_dimension_mappings.question_id = questions.id
        and question_dimension_mappings.dimension_id = question_dimensions.id
        and question_dimension_mappings.scoring_role = 'primary'
      where modules.key = any(${moduleKeys as string[]}::text[])
        and modules.is_selectable
        and modules.status in ('active', 'pilot', 'published', 'experimental')
        and questions.status in ('active', 'pilot', 'published', 'experimental')
        and questions.review_status = 'approved'
      order by modules.default_order, questions.item_code
    `;
    return rows.map((row) => ({
      clarifierEnabled: row.clarifier_enabled,
      consistencyPairKey: row.consistency_pair_key,
      constructKey: row.construct_key,
      dimensionId: row.dimension_id,
      evidenceTier: row.evidence_tier,
      exposureGroup: row.exposure_group,
      facetKey: row.facet_key,
      id: row.id,
      informationPriority: Number(row.information_priority),
      itemBankVersion: row.item_bank_version,
      itemCode: row.item_code,
      minimumDimensionCoverage: row.minimum_item_coverage,
      modeEligibility: row.mode_eligibility,
      moduleKey: row.module_key,
      moduleVersionId: row.module_version_id,
      polarity: row.polarity,
      reportTemplateVersion: row.report_template_version,
      scoringVersion: row.scoring_version,
    }));
  });
}

export function getMinimumModuleCoverage(
  candidates: readonly ComposerItemCandidate[],
): Readonly<Record<string, number>> {
  const coverageByDimension = new Map<string, number>();
  for (const candidate of candidates) {
    const dimensionKey = `${candidate.moduleKey}\u0000${candidate.constructKey}\u0000${candidate.facetKey}`;
    coverageByDimension.set(
      dimensionKey,
      Math.max(coverageByDimension.get(dimensionKey) ?? 0, candidate.minimumDimensionCoverage),
    );
  }

  const coverageByModule: Record<string, number> = {};
  for (const [dimensionKey, coverage] of coverageByDimension) {
    const [moduleKey] = dimensionKey.split("\u0000");
    if (!moduleKey) continue;
    coverageByModule[moduleKey] = (coverageByModule[moduleKey] ?? 0) + coverage;
  }
  return coverageByModule;
}

export async function composeFromDatabase(input: {
  candidates?: readonly ComposerItemCandidate[];
  contentVersion: string;
  estimate: AssessmentEstimate;
  locale: "id" | "en";
  seed: string;
}): Promise<ComposedBlueprint> {
  const candidates =
    input.candidates ??
    (await loadComposerCandidates(
      input.estimate.moduleAllocation.map((allocation) => allocation.moduleKey),
    ));
  return composeAssessment({ ...input, candidates });
}

export async function persistModularSession(input: {
  accountId: string | null;
  blueprint: ComposedBlueprint;
  consentVersion: string;
  expiresAt: Date;
  sessionTokenHash: string;
}): Promise<{ blueprintId: string; sessionId: string }> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const hash = blueprintHash(input.blueprint);
      const [blueprintRow] = await sql<{ id: string }[]>`
        insert into public.assessment_blueprints (
          status, composer_version, content_version, mode, selection_type, locale,
          selected_modules_json, segment_plan_json, item_count, estimated_minutes,
          segment_count, blueprint_hash, seed_hash, locked_at
        )
        values (
          'locked', ${input.blueprint.composerVersion}, ${input.blueprint.contentVersion},
          ${input.blueprint.mode}, ${input.blueprint.selectionType}, ${input.blueprint.locale},
          ${sql.json(
            input.blueprint.modules.map((moduleAllocation) => ({
              evidenceTier: moduleAllocation.evidenceTier,
              itemBankVersion: moduleAllocation.itemBankVersion,
              itemCount: moduleAllocation.itemCount,
              moduleKey: moduleAllocation.moduleKey,
              moduleVersionId: moduleAllocation.moduleVersionId,
              reportTemplateVersion: moduleAllocation.reportTemplateVersion,
              scoringVersion: moduleAllocation.scoringVersion,
            })),
          )},
          ${sql.json(input.blueprint.segmentPlan)}, ${input.blueprint.itemCount},
          ${input.blueprint.estimatedMinutes}, ${input.blueprint.segmentPlan.length},
          ${hash}, ${sha256(input.blueprint.seed)}, now()
        )
        returning id
      `;
      if (!blueprintRow) throw new Error("Blueprint insert returned no row.");

      for (const item of input.blueprint.items) {
        await sql`
          insert into public.assessment_blueprint_items (
            blueprint_id, question_id, module_version_id, dimension_id,
            segment_index, section_key, display_order, module_display_order,
            scoring_role, consistency_pair_key
          ) values (
            ${blueprintRow.id}, ${item.questionId}, ${item.moduleVersionId}, ${item.dimensionId},
            ${item.segmentIndex}, ${item.sectionKey}, ${item.displayOrder},
            ${item.moduleDisplayOrder}, ${item.scoringRole}, ${item.consistencyPairKey}
          )
        `;
      }

      const primaryModule = input.blueprint.modules[0];
      if (!primaryModule) throw new Error("Blueprint has no modules.");
      const [session] = await sql<{ id: string }[]>`
        insert into public.test_sessions (
          account_id, session_token_hash, mode, consent_version, module_version_id,
          selection_type, blueprint_id, expires_at, current_segment_index,
          last_activity_at
        ) values (
          ${input.accountId}, ${input.sessionTokenHash}, ${input.blueprint.mode},
          ${input.consentVersion}, ${primaryModule.moduleVersionId},
          ${input.blueprint.selectionType}, ${blueprintRow.id}, ${input.expiresAt}, 1, now()
        )
        returning id
      `;
      if (!session) throw new Error("Modular session insert returned no row.");

      await sql`
        insert into public.consents (
          account_id, session_id, consent_type, version, accepted_at
        ) values (
          ${input.accountId}, ${session.id}, 'assessment_processing',
          ${input.consentVersion}, now()
        )
      `;

      for (const moduleAllocation of input.blueprint.modules) {
        await sql`
          insert into public.test_session_modules (
            session_id, module_version_id, blueprint_id, status,
            item_count, required_answers
          ) values (
            ${session.id}, ${moduleAllocation.moduleVersionId}, ${blueprintRow.id}, 'active',
            ${moduleAllocation.itemCount}, ${moduleAllocation.requiredAnswers}
          )
        `;
      }
      for (const segment of input.blueprint.segmentPlan) {
        await sql`
          insert into public.test_session_segments (
            session_id, blueprint_id, segment_index, status, item_count,
            required_answers, started_at
          ) values (
            ${session.id}, ${blueprintRow.id}, ${segment.segmentIndex},
            ${segment.segmentIndex === 1 ? "active" : "pending"},
            ${segment.itemCount}, ${segment.itemCount},
            ${segment.segmentIndex === 1 ? new Date() : null}
          )
        `;
      }
      return { blueprintId: blueprintRow.id, sessionId: session.id };
    }),
  );
}

export type ModularStartInput = AssessmentSelectionInput & {
  readonly contentVersion: string;
  readonly consentVersion: string;
};

import "server-only";

import type { JSONValue } from "postgres";

import { getDatabase, withTransaction } from "@/lib/db/client";
import { decideClarifier, type ClarifierDecision } from "@/lib/scoring/clarifier";
import { correlateModuleResults } from "@/lib/scoring/correlation";
import { scoreIndependentModule } from "@/lib/scoring/modules/registry";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";
import type { ModuleScoringAnswer } from "@/lib/scoring/quality";
import {
  scoreProfile,
  traitKeys,
  type ProfileAnswer,
  type ProfileSummary,
  type TraitKey,
  type TraitScore,
} from "@/lib/scoring/profile";
import type { ItemPolarity, LikertValue } from "@/lib/scoring/likert";
import { runDatabaseOperation } from "@/server/database";
import {
  isPublicShareScope,
  toSafeSharedResultView,
  type SafeSharedResultView,
} from "@/server/repositories/result-views";

export type AssessmentMode = "quick" | "standard" | "deep";

export type AssessmentQuestion = {
  answer: number | null;
  id: string;
  moduleKey?: string;
  order: number;
  sectionKey?: string;
  segmentIndex?: number;
  text: string;
};

export type AssessmentSessionView = {
  answeredCount: number;
  currentSegmentIndex?: number;
  isModular: boolean;
  mode: AssessmentMode;
  questions: AssessmentQuestion[];
  segmentCount?: number;
  status: "active" | "paused" | "clarifier_required" | "completed" | "expired" | "revoked";
  totalCount: number;
};

export type AccountResultSummary = {
  archetype: string;
  createdAt: string;
  scoringVersion: string;
};

export type LegacyResultView = {
  kind: "legacy";
  createdAt: string;
  quality: { answeredItems: number; confidence: number; straightLineWarning: boolean };
  scores: TraitScore[];
  summary: ProfileSummary;
};

export type ModularResultView = {
  kind: "modular";
  correlations: Array<{
    confidence: number;
    kind: string;
    narrativeKey: string;
    ruleKey: string;
    sourceModuleKeys: string[];
  }>;
  createdAt: string;
  modules: IndependentModuleResult[];
  quality: { confidence: number; flags: string[] };
  summary: { disclaimer: string; moduleKeys: string[] };
};

export type PrivateResultView = LegacyResultView | ModularResultView;

/** @deprecated Use PrivateResultView for protected result reads. */
export type ResultView = PrivateResultView;

export type AssessmentCompletion =
  { resultId: string } | { clarifiers: ClarifierDecision[]; status: "clarifier_required" };

export type ClarifierQuestion = {
  answer: number | null;
  id: string;
  moduleKey: string;
  order: number;
  text: string;
};

export type ClarifierSessionView = {
  questions: ClarifierQuestion[];
  status: "in_progress";
  totalCount: number;
};

type LockedBlueprintModule = {
  evidenceTier: IndependentModuleResult["evidenceTier"];
  itemBankVersion: string;
  itemCount: number;
  moduleKey: string;
  moduleVersionId: string;
  reportTemplateVersion: string;
  scoringVersion: string;
};

function isEvidenceTier(value: unknown): value is IndependentModuleResult["evidenceTier"] {
  return (
    typeof value === "string" && ["A", "B", "B_EXPERIMENTAL", "EXPERIMENTAL", "C"].includes(value)
  );
}

function parseLockedBlueprintModules(value: unknown): readonly LockedBlueprintModule[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Blueprint module provenance is unavailable.");
  }
  const modules = value.map((entry): LockedBlueprintModule => {
    if (!entry || typeof entry !== "object") {
      throw new Error("Blueprint module provenance is invalid.");
    }
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.moduleKey !== "string" ||
      typeof candidate.moduleVersionId !== "string" ||
      typeof candidate.scoringVersion !== "string" ||
      typeof candidate.itemBankVersion !== "string" ||
      typeof candidate.reportTemplateVersion !== "string" ||
      typeof candidate.itemCount !== "number" ||
      !Number.isInteger(candidate.itemCount) ||
      candidate.itemCount <= 0 ||
      !isEvidenceTier(candidate.evidenceTier)
    ) {
      throw new Error("Blueprint module provenance is invalid.");
    }
    return {
      evidenceTier: candidate.evidenceTier,
      itemBankVersion: candidate.itemBankVersion,
      itemCount: candidate.itemCount,
      moduleKey: candidate.moduleKey,
      moduleVersionId: candidate.moduleVersionId,
      reportTemplateVersion: candidate.reportTemplateVersion,
      scoringVersion: candidate.scoringVersion,
    };
  });
  if (new Set(modules.map((module) => module.moduleKey)).size !== modules.length) {
    throw new Error("Blueprint contains duplicate module provenance.");
  }
  return modules;
}

function toDatabaseJson(value: unknown): JSONValue {
  return JSON.parse(JSON.stringify(value)) as JSONValue;
}

function isTraitKey(value: string): value is TraitKey {
  return (traitKeys as readonly string[]).includes(value);
}

export async function createAssessmentSession(input: {
  accountId: string | null;
  consentVersion: string;
  expiresAt: Date;
  mode: AssessmentMode;
  sessionTokenHash: string;
}): Promise<{ id: string }> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [version] = await sql<{ id: string }[]>`
        select module_versions.id
        from public.module_versions
        inner join public.modules on modules.id = module_versions.module_id
        where modules.key = 'trait_profile'
          and modules.status = 'active'
          and module_versions.status = 'active'
        order by module_versions.published_at desc nulls last
        limit 1
      `;
      if (!version) throw new Error("Active assessment module is unavailable.");

      const [session] = await sql<{ id: string }[]>`
        insert into public.test_sessions (
          account_id, session_token_hash, mode, consent_version, module_version_id, expires_at
        )
        values (
          ${input.accountId}, ${input.sessionTokenHash}, ${input.mode},
          ${input.consentVersion}, ${version.id}, ${input.expiresAt}
        )
        returning id
      `;
      if (!session) throw new Error("Assessment session insert returned no row.");

      await sql`
        insert into public.consents (
          account_id, session_id, consent_type, version, accepted_at
        )
        values (
          ${input.accountId}, ${session.id}, 'assessment_processing',
          ${input.consentVersion}, now()
        )
      `;
      return session;
    }),
  );
}

export async function getAssessmentSessionByHash(
  sessionTokenHash: string,
): Promise<AssessmentSessionView | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [session] = await sql<
      {
        blueprint_id: string | null;
        current_segment_index: number;
        id: string;
        mode: AssessmentMode;
        status: AssessmentSessionView["status"];
      }[]
    >`
      select id, mode, status, blueprint_id, current_segment_index
      from public.test_sessions
      where session_token_hash = ${sessionTokenHash}
        and expires_at > now()
      limit 1
    `;
    if (!session) return null;

    const questions = session.blueprint_id
      ? await sql<
          {
            answer: number | null;
            display_order: number;
            id: string;
            module_key: string;
            public_text: string;
            section_key: string;
            segment_index: number;
          }[]
        >`
          select
            questions.id,
            coalesce(question_translations.public_text, questions.public_text) as public_text,
            assessment_blueprint_items.display_order,
            assessment_blueprint_items.segment_index,
            assessment_blueprint_items.section_key,
            modules.key as module_key,
            user_answers.raw_value as answer
          from public.assessment_blueprint_items
          inner join public.questions on questions.id = assessment_blueprint_items.question_id
          inner join public.modules
            on modules.id = (
              select module_id from public.module_versions
              where id = assessment_blueprint_items.module_version_id
            )
          left join public.question_translations
            on question_translations.question_id = questions.id
            and question_translations.locale = 'id'
          left join public.user_answers
            on user_answers.question_id = questions.id
            and user_answers.session_id = ${session.id}
          where assessment_blueprint_items.blueprint_id = ${session.blueprint_id}
          order by assessment_blueprint_items.display_order
        `
      : await sql<
          {
            answer: number | null;
            display_order: number;
            id: string;
            module_key: string;
            public_text: string;
            section_key: string;
            segment_index: number;
          }[]
        >`
          select
            questions.id,
            questions.public_text,
            questions.display_order,
            1::smallint as segment_index,
            'trait_profile'::text as section_key,
            'trait_profile'::text as module_key,
            user_answers.raw_value as answer
          from public.questions
          left join public.user_answers
            on user_answers.question_id = questions.id
            and user_answers.session_id = ${session.id}
          inner join public.test_sessions
            on test_sessions.id = ${session.id}
            and test_sessions.module_version_id = questions.module_version_id
          where questions.status = 'active'
            and (
              ${session.mode}::public.assessment_mode in ('standard', 'deep')
              or questions.quick_enabled
            )
          order by questions.display_order
        `;
    const segmentCount = Math.max(1, ...questions.map((question) => question.segment_index));

    return {
      answeredCount: questions.filter((question) => question.answer !== null).length,
      currentSegmentIndex: session.current_segment_index,
      isModular: session.blueprint_id !== null,
      mode: session.mode,
      questions: questions.map((question) => ({
        answer: question.answer,
        id: question.id,
        moduleKey: question.module_key,
        order: question.display_order,
        sectionKey: question.section_key,
        segmentIndex: question.segment_index,
        text: question.public_text,
      })),
      segmentCount,
      status: session.status,
      totalCount: questions.length,
    };
  });
}

export async function saveAssessmentAnswer(input: {
  idempotencyKey: string;
  questionId: string;
  rawValue: LikertValue;
  responseTimeMs: number | null;
  sessionTokenHash: string;
}): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      insert into public.user_answers (
        session_id, question_id, raw_value, response_time_ms, idempotency_key, answered_at
      )
      select
        test_sessions.id, questions.id, ${input.rawValue}, ${input.responseTimeMs},
        ${input.idempotencyKey}::uuid, now()
      from public.test_sessions
      inner join public.questions on questions.id = ${input.questionId}::uuid
      left join public.assessment_blueprint_items
        on assessment_blueprint_items.blueprint_id = test_sessions.blueprint_id
        and assessment_blueprint_items.question_id = questions.id
      where test_sessions.session_token_hash = ${input.sessionTokenHash}
        and test_sessions.status = 'active'
        and test_sessions.expires_at > now()
        and questions.status = 'active'
        and (
          (
            test_sessions.blueprint_id is null
            and questions.module_version_id = test_sessions.module_version_id
            and (test_sessions.mode in ('standard', 'deep') or questions.quick_enabled)
          )
          or (
            test_sessions.blueprint_id is not null
            and assessment_blueprint_items.id is not null
          )
        )
      on conflict (session_id, question_id) do update set
        raw_value = excluded.raw_value,
        response_time_ms = excluded.response_time_ms,
        idempotency_key = excluded.idempotency_key,
        answered_at = excluded.answered_at,
        answer_revision = public.user_answers.answer_revision + 1
    `;
    return rows.count > 0;
  });
}

export async function setAssessmentPaused(
  sessionTokenHash: string,
  paused: boolean,
): Promise<boolean> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const rows = paused
        ? await sql`
            update public.test_sessions
            set status = 'paused', paused_at = now(), last_activity_at = now()
            where session_token_hash = ${sessionTokenHash}
              and status = 'active'
              and blueprint_id is not null
              and expires_at > now()
          `
        : await sql`
            update public.test_sessions
            set status = 'active', paused_at = null, last_activity_at = now()
            where session_token_hash = ${sessionTokenHash}
              and status = 'paused'
              and blueprint_id is not null
              and expires_at > now()
          `;
      if (rows.count === 0) return false;

      if (paused) {
        await sql`
          update public.test_session_segments
          set status = 'paused', paused_at = now()
          where session_id = (
            select id from public.test_sessions
            where session_token_hash = ${sessionTokenHash}
          ) and status = 'active'
        `;
      } else {
        await sql`
          update public.test_session_segments
          set status = 'active', paused_at = null,
              started_at = coalesce(started_at, now())
          where session_id = (
            select id from public.test_sessions
            where session_token_hash = ${sessionTokenHash}
          ) and status = 'paused'
        `;
      }
      return true;
    }),
  );
}

async function completeModularAssessmentInTransaction(
  sql: Parameters<Parameters<typeof withTransaction>[0]>[0],
  session: {
    account_id: string | null;
    blueprint_id: string;
    id: string;
    mode: AssessmentMode;
  },
  resultTokenHash: string,
): Promise<AssessmentCompletion | null> {
  const [blueprint] = await sql<
    {
      composer_version: string;
      content_version: string;
      selected_modules_json: unknown;
    }[]
  >`
    select composer_version, content_version, selected_modules_json
    from public.assessment_blueprints
    where id = ${session.blueprint_id}
    for update
  `;
  if (!blueprint) throw new Error("Blueprint provenance is unavailable.");
  const lockedModules = parseLockedBlueprintModules(blueprint.selected_modules_json);

  const sessionModuleRows = await sql<
    {
      evidence_tier: IndependentModuleResult["evidenceTier"];
      item_bank_version: string;
      item_count: number;
      module_key: string;
      module_version_id: string;
      report_template_version: string;
      required_answers: number;
      scoring_version: string;
    }[]
  >`
    select
      modules.key as module_key,
      modules.evidence_tier,
      module_versions.id as module_version_id,
      module_versions.scoring_version,
      module_versions.item_bank_version,
      module_versions.report_template_version,
      test_session_modules.item_count,
      test_session_modules.required_answers
    from public.test_session_modules
    inner join public.module_versions on module_versions.id = test_session_modules.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    where test_session_modules.session_id = ${session.id}
    order by modules.default_order
  `;
  if (sessionModuleRows.length !== lockedModules.length) {
    throw new Error("Session module provenance does not match blueprint.");
  }
  const lockedByVersion = new Map(lockedModules.map((module) => [module.moduleVersionId, module]));
  const expectedRows = sessionModuleRows.map((row) => {
    const locked = lockedByVersion.get(row.module_version_id);
    if (
      !locked ||
      row.module_key !== locked.moduleKey ||
      row.scoring_version !== locked.scoringVersion ||
      row.item_bank_version !== locked.itemBankVersion ||
      row.report_template_version !== locked.reportTemplateVersion ||
      row.evidence_tier !== locked.evidenceTier ||
      row.item_count !== locked.itemCount ||
      row.required_answers !== locked.itemCount
    ) {
      throw new Error(`Session module provenance mismatch for ${row.module_key}.`);
    }
    return locked;
  });

  const baseRows = await sql<
    {
      construct_key: string;
      evidence_tier: IndependentModuleResult["evidenceTier"];
      item_code: string;
      module_key: string;
      module_version_id: string;
      polarity: ItemPolarity;
      raw_value: LikertValue;
      report_template_version: string;
      response_time_ms: number | null;
      scoring_version: string;
      weight: string;
    }[]
  >`
    select
      modules.key as module_key,
      modules.evidence_tier,
      module_versions.id as module_version_id,
      module_versions.scoring_version,
      module_versions.report_template_version,
      question_dimensions.construct_key,
      questions.item_code,
      question_dimension_mappings.polarity,
      question_dimension_mappings.weight::text,
      user_answers.raw_value,
      user_answers.response_time_ms
    from public.assessment_blueprint_items
    inner join public.module_versions
      on module_versions.id = assessment_blueprint_items.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    inner join public.questions on questions.id = assessment_blueprint_items.question_id
    inner join public.question_dimensions
      on question_dimensions.id = assessment_blueprint_items.dimension_id
    inner join public.question_dimension_mappings
      on question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = question_dimensions.id
      and question_dimension_mappings.scoring_role = 'primary'
    inner join public.user_answers
      on user_answers.question_id = questions.id
      and user_answers.session_id = ${session.id}
    where assessment_blueprint_items.blueprint_id = ${session.blueprint_id}
    order by assessment_blueprint_items.display_order
  `;
  const supplementalRows = await sql<
    {
      construct_key: string;
      evidence_tier: IndependentModuleResult["evidenceTier"];
      item_code: string;
      module_key: string;
      module_version_id: string;
      polarity: ItemPolarity;
      raw_value: LikertValue;
      report_template_version: string;
      response_time_ms: number | null;
      scoring_version: string;
      weight: string;
    }[]
  >`
    select
      modules.key as module_key,
      modules.evidence_tier,
      module_versions.id as module_version_id,
      module_versions.scoring_version,
      module_versions.report_template_version,
      question_dimensions.construct_key,
      questions.item_code,
      question_dimension_mappings.polarity,
      question_dimension_mappings.weight::text,
      result_clarifier_answers.raw_value,
      result_clarifier_answers.response_time_ms
    from public.result_clarifiers
    inner join public.result_clarifier_items
      on result_clarifier_items.clarifier_id = result_clarifiers.id
    inner join public.result_clarifier_answers
      on result_clarifier_answers.clarifier_item_id = result_clarifier_items.id
    inner join public.module_versions
      on module_versions.id = result_clarifiers.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    inner join public.questions on questions.id = result_clarifier_items.question_id
    inner join public.question_dimensions
      on question_dimensions.id = result_clarifier_items.dimension_id
    inner join public.question_dimension_mappings
      on question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = question_dimensions.id
      and question_dimension_mappings.scoring_role = 'primary'
    where result_clarifiers.session_id = ${session.id}
      and result_clarifiers.status = 'completed'
    order by result_clarifiers.created_at, result_clarifier_items.display_order
  `;
  const rows = [...baseRows, ...supplementalRows];
  const baseExpectedCount = expectedRows.reduce((sum, row) => sum + row.itemCount, 0);
  if (baseRows.length !== baseExpectedCount) return null;

  const moduleResults = expectedRows.map((expected) => {
    const moduleAnswers: ModuleScoringAnswer[] = rows
      .filter(
        (row) =>
          row.module_key === expected.moduleKey &&
          row.module_version_id === expected.moduleVersionId,
      )
      .map((row) => ({
        constructKey: row.construct_key,
        itemCode: row.item_code,
        polarity: row.polarity,
        responseTimeMs: row.response_time_ms,
        value: row.raw_value,
        weight: Number(row.weight),
      }));
    const result = scoreIndependentModule({
      answers: moduleAnswers,
      expectedAnswers: expected.itemCount,
      moduleKey: expected.moduleKey,
      scoringVersion: expected.scoringVersion,
    });
    if (
      result.moduleKey !== expected.moduleKey ||
      result.evidenceTier !== expected.evidenceTier ||
      result.scoringVersion !== expected.scoringVersion
    ) {
      throw new Error(`Scoring provenance mismatch for ${expected.moduleKey}.`);
    }
    return { expected, result };
  });
  const resolvedRows = await sql<{ module_version_id: string; status: "completed" | "skipped" }[]>`
    select module_version_id, status
    from public.result_clarifiers
    where session_id = ${session.id} and status in ('completed', 'skipped')
  `;
  const resolvedVersions = new Set(resolvedRows.map((row) => row.module_version_id));
  const clarifierCandidates = moduleResults
    .map(({ expected, result }) => ({ decision: decideClarifier(result), expected }))
    .filter(
      (entry): entry is { decision: ClarifierDecision; expected: LockedBlueprintModule } =>
        entry.decision !== null,
    );
  const clarifiers: ClarifierDecision[] = [];
  for (const { decision, expected } of clarifierCandidates) {
    const [capacity] = await sql<{ count: number }[]>`
      select count(*)::integer as count
      from public.questions
      where module_version_id = ${expected.moduleVersionId}
        and clarifier_enabled
        and status in ('active', 'pilot', 'published', 'experimental')
        and review_status = 'approved'
        and not exists (
          select 1 from public.assessment_blueprint_items
          where assessment_blueprint_items.blueprint_id = ${session.blueprint_id}
            and assessment_blueprint_items.question_id = questions.id
        )
    `;
    const availableCount = capacity?.count ?? 0;
    if (availableCount >= 12) {
      clarifiers.push({
        ...decision,
        itemCount: Math.min(decision.itemCount, availableCount),
        required: decision.required,
      });
    }
  }
  const requiredModuleKey = clarifiers
    .filter((clarifier) => clarifier.required)
    .toSorted((left, right) => {
      const leftConfidence =
        moduleResults.find(({ result }) => result.moduleKey === left.moduleKey)?.result
          .confidence ?? 1;
      const rightConfidence =
        moduleResults.find(({ result }) => result.moduleKey === right.moduleKey)?.result
          .confidence ?? 1;
      return leftConfidence - rightConfidence || left.moduleKey.localeCompare(right.moduleKey);
    })[0]?.moduleKey;
  const normalizedClarifiers = clarifiers.map((clarifier) => ({
    ...clarifier,
    required: clarifier.required && clarifier.moduleKey === requiredModuleKey,
  }));
  const unresolvedRequired = normalizedClarifiers.filter((clarifier) => {
    const expected = expectedRows.find((row) => row.moduleKey === clarifier.moduleKey);
    return clarifier.required && expected && !resolvedVersions.has(expected.moduleVersionId);
  });
  if (unresolvedRequired.length > 0) {
    for (const clarifier of normalizedClarifiers) {
      const expected = expectedRows.find((row) => row.moduleKey === clarifier.moduleKey);
      if (!expected || resolvedVersions.has(expected.moduleVersionId)) continue;
      await sql`
        insert into public.result_clarifiers (
          session_id, module_version_id, reason_code, status,
          target_dimensions_json, item_count, required
        ) values (
          ${session.id}, ${expected.moduleVersionId}, ${clarifier.reasonCode},
          ${clarifier.required ? "required" : "recommended"},
          ${sql.json(toDatabaseJson(clarifier.targetConstructKeys))}, ${clarifier.itemCount},
          ${clarifier.required}
        )
        on conflict (session_id, module_version_id) do update set
          reason_code = excluded.reason_code,
          status = excluded.status,
          target_dimensions_json = excluded.target_dimensions_json,
          item_count = excluded.item_count,
          required = excluded.required
      `;
    }
    await sql`
      update public.test_sessions set status = 'clarifier_required'
      where id = ${session.id}
    `;
    return { clarifiers: unresolvedRequired, status: "clarifier_required" };
  }

  const correlations = correlateModuleResults(moduleResults.map(({ result }) => result));
  const finalizedClarifiers = normalizedClarifiers;
  const evidenceWeights: Record<IndependentModuleResult["evidenceTier"], number> = {
    A: 1,
    B: 0.85,
    B_EXPERIMENTAL: 0.65,
    C: 0,
    EXPERIMENTAL: 0.5,
  };
  const weightedModules = moduleResults
    .map(({ result }) => ({ result, weight: evidenceWeights[result.evidenceTier] }))
    .filter(({ weight }) => weight > 0);
  const weightTotal = weightedModules.reduce((sum, { weight }) => sum + weight, 0);
  const overallConfidence = Number(
    (weightTotal === 0
      ? 0
      : weightedModules.reduce((sum, { result, weight }) => sum + result.confidence * weight, 0) /
        weightTotal
    ).toFixed(4),
  );
  const overallFlags = new Set(
    moduleResults.flatMap(({ result }) => result.quality.flags as readonly string[]),
  );
  if (moduleResults.some(({ result }) => result.confidence < 0.5)) {
    overallFlags.add("weakest_module_low_confidence");
  }
  if (new Set(moduleResults.map(({ result }) => result.evidenceTier)).size > 1) {
    overallFlags.add("mixed_evidence_tiers");
  }
  if (resolvedRows.some((row) => row.status === "skipped")) {
    overallFlags.add("clarifier_skipped");
  }
  const [resultRow] = await sql<{ id: string }[]>`
    insert into public.personality_results (
      account_id, session_id, result_token_hash, scoring_version, summary_json, quality_json
    ) values (
      ${session.account_id}, ${session.id}, ${resultTokenHash}, 'modular-result-1',
      ${sql.json({
        disclaimer: "Hasil modular adalah refleksi dari lensa yang dipilih, bukan diagnosis.",
        moduleKeys: moduleResults.map(({ result }) => result.moduleKey),
      })},
      ${sql.json({
        confidence: overallConfidence,
        flags: [...overallFlags].toSorted(),
      })}
    )
    returning id
  `;
  if (!resultRow) throw new Error("Modular result insert returned no row.");

  const resultModuleIds = new Map<string, string>();
  for (const { expected, result } of moduleResults) {
    const [moduleRow] = await sql<{ id: string }[]>`
      insert into public.result_modules (
        result_id, module_version_id, module_key, scoring_version, item_bank_version,
        composer_version, evidence_tier, confidence, completion, ambiguity_json, summary_json, quality_json
      ) values (
        ${resultRow.id}, ${expected.moduleVersionId}, ${result.moduleKey},
        ${result.scoringVersion}, ${expected.itemBankVersion}, ${blueprint.composer_version},
        ${result.evidenceTier}, ${result.confidence}, ${result.quality.completion},
        ${sql.json(toDatabaseJson(result.ambiguity))},
        ${sql.json(toDatabaseJson(result.summary))}, ${sql.json(toDatabaseJson(result.quality))}
      ) returning id
    `;
    if (!moduleRow) throw new Error("Result module insert returned no row.");
    resultModuleIds.set(result.moduleKey, moduleRow.id);
    for (const score of result.scores) {
      await sql`
        insert into public.result_module_scores (
          result_module_id, construct_key, facet_key, raw_score,
          normalized_score, confidence, rank_or_candidate_json
        ) values (
          ${moduleRow.id}, ${score.constructKey}, ${score.facetKey}, ${score.rawScore},
          ${score.normalizedScore}, ${score.confidence}, '{}'::jsonb
        )
      `;
    }
  }

  await sql`
    update public.result_clarifiers
    set result_id = ${resultRow.id}
    where session_id = ${session.id}
  `;
  for (const clarifier of finalizedClarifiers) {
    const expected = expectedRows.find((row) => row.moduleKey === clarifier.moduleKey);
    if (!expected || resolvedVersions.has(expected.moduleVersionId)) continue;
    await sql`
      insert into public.result_clarifiers (
        session_id, result_id, module_version_id, reason_code, status,
        target_dimensions_json, item_count, required
      ) values (
        ${session.id}, ${resultRow.id}, ${expected.moduleVersionId}, ${clarifier.reasonCode},
        'recommended', ${sql.json(toDatabaseJson(clarifier.targetConstructKeys))},
        ${clarifier.itemCount}, false
      )
      on conflict (session_id, module_version_id) do update set
        result_id = excluded.result_id,
        reason_code = excluded.reason_code,
        target_dimensions_json = excluded.target_dimensions_json,
        item_count = excluded.item_count
    `;
  }

  for (const correlation of correlations) {
    const [correlationRow] = await sql<{ id: string }[]>`
      insert into public.result_correlations (
        result_id, correlation_version, rule_key, kind, confidence,
        narrative_key, context_json
      ) values (
        ${resultRow.id}, 'correlation-rules-1', ${correlation.ruleKey},
        ${correlation.kind}, ${correlation.confidence}, ${correlation.narrativeKey},
        ${sql.json(toDatabaseJson(correlation.context))}
      ) returning id
    `;
    if (!correlationRow) throw new Error("Correlation insert returned no row.");
    for (const moduleKey of correlation.sourceModuleKeys) {
      const resultModuleId = resultModuleIds.get(moduleKey);
      if (!resultModuleId) continue;
      await sql`
        insert into public.result_correlation_sources (correlation_id, result_module_id)
        values (${correlationRow.id}, ${resultModuleId})
      `;
    }
  }

  await sql`
    insert into public.result_versions (
      result_id, blueprint_id, composer_version, content_version,
      report_template_version, is_legacy
    ) values (
      ${resultRow.id}, ${session.blueprint_id}, ${blueprint.composer_version},
      ${blueprint.content_version},
      ${expectedRows
        .map((row) => row.reportTemplateVersion)
        .toSorted()
        .join("+")}, false
    )
  `;
  await sql`
    update public.test_session_modules
    set status = 'completed', completed_at = now()
    where session_id = ${session.id}
  `;
  await sql`
    update public.test_session_segments
    set status = 'completed', completed_at = now(), paused_at = null
    where session_id = ${session.id}
  `;
  await sql`
    update public.test_sessions
    set status = 'completed', completed_at = now()
    where id = ${session.id}
  `;
  return { resultId: resultRow.id };
}

async function loadClarifierSession(
  sql: Parameters<Parameters<typeof withTransaction>[0]>[0],
  sessionId: string,
): Promise<ClarifierSessionView | null> {
  const questions = await sql<
    {
      answer: number | null;
      display_order: number;
      id: string;
      module_key: string;
      public_text: string;
    }[]
  >`
    select result_clarifier_items.question_id as id,
      result_clarifier_items.display_order,
      coalesce(question_translations.public_text, questions.public_text) as public_text,
      modules.key as module_key,
      result_clarifier_answers.raw_value as answer
    from public.result_clarifiers
    inner join public.result_clarifier_items
      on result_clarifier_items.clarifier_id = result_clarifiers.id
    inner join public.questions on questions.id = result_clarifier_items.question_id
    inner join public.module_versions on module_versions.id = result_clarifiers.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    left join public.question_translations
      on question_translations.question_id = questions.id
      and question_translations.locale = 'id'
    left join public.result_clarifier_answers
      on result_clarifier_answers.clarifier_item_id = result_clarifier_items.id
    where result_clarifiers.session_id = ${sessionId}
      and result_clarifiers.status = 'in_progress'
    order by result_clarifier_items.display_order
  `;
  if (questions.length === 0) return null;
  return {
    questions: questions.map((question) => ({
      answer: question.answer,
      id: question.id,
      moduleKey: question.module_key,
      order: question.display_order,
      text: question.public_text,
    })),
    status: "in_progress",
    totalCount: questions.length,
  };
}

export async function startClarifier(
  sessionTokenHash: string,
): Promise<ClarifierSessionView | null> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [session] = await sql<{ blueprint_id: string; id: string }[]>`
        select id, blueprint_id
        from public.test_sessions
        where session_token_hash = ${sessionTokenHash}
          and status = 'clarifier_required'
          and blueprint_id is not null
          and expires_at > now()
        for update
      `;
      if (!session) return null;
      const existing = await loadClarifierSession(sql, session.id);
      if (existing) return existing;

      const [clarifier] = await sql<
        { id: string; item_count: number; module_version_id: string; target_dimensions: string[] }[]
      >`
        select id, module_version_id, item_count,
          array(select jsonb_array_elements_text(target_dimensions_json)) as target_dimensions
        from public.result_clarifiers
        where session_id = ${session.id} and status = 'required'
        order by created_at, id
        limit 1
        for update
      `;
      if (!clarifier) return null;
      const candidates = await sql<{ dimension_id: string; question_id: string }[]>`
        select questions.dimension_id, questions.id as question_id
        from public.questions
        inner join public.question_dimensions
          on question_dimensions.id = questions.dimension_id
        where questions.module_version_id = ${clarifier.module_version_id}
          and questions.clarifier_enabled
          and questions.status in ('active', 'pilot', 'published', 'experimental')
          and questions.review_status = 'approved'
          and not exists (
            select 1 from public.assessment_blueprint_items
            where assessment_blueprint_items.blueprint_id = ${session.blueprint_id}
              and assessment_blueprint_items.question_id = questions.id
          )
        order by
          (question_dimensions.construct_key = any(${clarifier.target_dimensions}::text[])) desc,
          questions.information_priority desc,
          md5(${session.id} || ':' || questions.id::text),
          questions.item_code
        limit ${clarifier.item_count}
      `;
      if (candidates.length !== clarifier.item_count) return null;
      for (const [index, candidate] of candidates.entries()) {
        await sql`
          insert into public.result_clarifier_items (
            clarifier_id, question_id, dimension_id, display_order
          ) values (
            ${clarifier.id}, ${candidate.question_id}, ${candidate.dimension_id}, ${index + 1}
          )
        `;
      }
      await sql`
        update public.result_clarifiers
        set status = 'in_progress', started_at = now()
        where id = ${clarifier.id}
      `;
      return loadClarifierSession(sql, session.id);
    }),
  );
}

export async function saveClarifierAnswer(input: {
  questionId: string;
  rawValue: LikertValue;
  responseTimeMs: number | null;
  sessionTokenHash: string;
}): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      insert into public.result_clarifier_answers (
        clarifier_item_id, raw_value, response_time_ms, answered_at
      )
      select result_clarifier_items.id, ${input.rawValue}, ${input.responseTimeMs}, now()
      from public.result_clarifier_items
      inner join public.result_clarifiers
        on result_clarifiers.id = result_clarifier_items.clarifier_id
      inner join public.test_sessions on test_sessions.id = result_clarifiers.session_id
      where test_sessions.session_token_hash = ${input.sessionTokenHash}
        and test_sessions.status = 'clarifier_required'
        and test_sessions.expires_at > now()
        and result_clarifiers.status = 'in_progress'
        and result_clarifier_items.question_id = ${input.questionId}::uuid
      on conflict (clarifier_item_id) do update set
        raw_value = excluded.raw_value,
        response_time_ms = excluded.response_time_ms,
        answered_at = excluded.answered_at,
        answer_revision = public.result_clarifier_answers.answer_revision + 1
    `;
    return rows.count > 0;
  });
}

export async function resolveClarifier(input: {
  action: "complete" | "skip";
  resultTokenHash: string;
  sessionTokenHash: string;
}): Promise<AssessmentCompletion | null> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [session] = await sql<
        { account_id: string | null; blueprint_id: string; id: string; mode: AssessmentMode }[]
      >`
        select id, account_id, mode, blueprint_id
        from public.test_sessions
        where session_token_hash = ${input.sessionTokenHash}
          and status in ('clarifier_required', 'completed')
          and blueprint_id is not null
          and expires_at > now()
        for update
      `;
      if (!session) return null;
      const [existing] = await sql<{ id: string }[]>`
        select id from public.personality_results
        where session_id = ${session.id} and deleted_at is null
        limit 1
      `;
      if (existing) return { resultId: existing.id };
      const [clarifier] = await sql<{ answered_count: number; id: string; item_count: number }[]>`
        select result_clarifiers.id, result_clarifiers.item_count,
          count(result_clarifier_answers.id)::integer as answered_count
        from public.result_clarifiers
        left join public.result_clarifier_items
          on result_clarifier_items.clarifier_id = result_clarifiers.id
        left join public.result_clarifier_answers
          on result_clarifier_answers.clarifier_item_id = result_clarifier_items.id
        where result_clarifiers.id = (
          select candidate.id
          from public.result_clarifiers as candidate
          where candidate.session_id = ${session.id}
            and candidate.status in ('required', 'in_progress')
            and candidate.required
          order by candidate.created_at, candidate.id
          limit 1
          for update
        )
        group by result_clarifiers.id
      `;
      if (!clarifier) return null;
      if (input.action === "complete" && clarifier.answered_count !== clarifier.item_count) {
        return null;
      }
      await sql`
        update public.result_clarifiers
        set status = ${input.action === "complete" ? "completed" : "skipped"},
          completed_at = ${input.action === "complete" ? new Date() : null},
          skipped_at = ${input.action === "skip" ? new Date() : null}
        where id = ${clarifier.id}
      `;
      await sql`
        update public.test_sessions set status = 'active'
        where id = ${session.id}
      `;
      return completeModularAssessmentInTransaction(sql, session, input.resultTokenHash);
    }),
  );
}

export async function completeAssessment(input: {
  resultTokenHash: string;
  sessionTokenHash: string;
}): Promise<AssessmentCompletion | null> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [session] = await sql<
        {
          account_id: string | null;
          blueprint_id: string | null;
          id: string;
          mode: AssessmentMode;
          status: AssessmentSessionView["status"];
        }[]
      >`
        select id, account_id, mode, status, blueprint_id
        from public.test_sessions
        where session_token_hash = ${input.sessionTokenHash}
          and status in ('active', 'completed', 'clarifier_required')
          and expires_at > now()
        for update
      `;
      if (!session) return null;
      const [existing] = await sql<{ id: string }[]>`
        select id from public.personality_results
        where session_id = ${session.id} and deleted_at is null
        limit 1
      `;
      if (existing) return { resultId: existing.id };
      if (session.status === "clarifier_required") {
        const clarifierRows = await sql<
          {
            item_count: number;
            module_key: string;
            reason_code: ClarifierDecision["reasonCode"];
            required: boolean;
            target_dimensions_json: string[];
          }[]
        >`
          select result_clarifiers.item_count, modules.key as module_key,
            result_clarifiers.reason_code, result_clarifiers.required,
            result_clarifiers.target_dimensions_json
          from public.result_clarifiers
          inner join public.module_versions
            on module_versions.id = result_clarifiers.module_version_id
          inner join public.modules on modules.id = module_versions.module_id
          where result_clarifiers.session_id = ${session.id}
            and result_clarifiers.status in ('required', 'in_progress')
          order by result_clarifiers.created_at
        `;
        return clarifierRows.length === 0
          ? null
          : {
              clarifiers: clarifierRows.map((clarifier) => ({
                itemCount: clarifier.item_count,
                moduleKey: clarifier.module_key,
                reasonCode: clarifier.reason_code,
                required: clarifier.required,
                targetConstructKeys: clarifier.target_dimensions_json,
              })),
              status: "clarifier_required",
            };
      }
      if (session.blueprint_id) {
        return completeModularAssessmentInTransaction(
          sql,
          { ...session, blueprint_id: session.blueprint_id },
          input.resultTokenHash,
        );
      }

      const rows = await sql<
        {
          construct_key: string;
          polarity: ItemPolarity;
          raw_value: LikertValue;
          weight: string;
        }[]
      >`
        select
          question_dimensions.construct_key,
          questions.polarity,
          questions.weight::text,
          user_answers.raw_value
        from public.questions
        inner join public.question_dimensions on question_dimensions.id = questions.dimension_id
        inner join public.user_answers
          on user_answers.question_id = questions.id
          and user_answers.session_id = ${session.id}
        where questions.module_version_id = (
          select module_version_id from public.test_sessions where id = ${session.id}
        )
          and questions.status = 'active'
          and (${session.mode}::public.assessment_mode in ('standard', 'deep') or questions.quick_enabled)
        order by questions.display_order
      `;
      const expectedCount = session.mode === "quick" ? 40 : 60;
      if (rows.length !== expectedCount) return null;

      const answers: ProfileAnswer[] = rows.map((row) => {
        if (!isTraitKey(row.construct_key)) throw new Error("Unknown scoring construct.");
        return {
          constructKey: row.construct_key,
          polarity: row.polarity,
          value: row.raw_value,
          weight: Number(row.weight),
        };
      });
      const scored = scoreProfile(answers);
      const [result] = await sql<{ id: string }[]>`
        insert into public.personality_results (
          account_id, session_id, result_token_hash, scoring_version, summary_json, quality_json
        )
        values (
          ${session.account_id}, ${session.id}, ${input.resultTokenHash},
          ${scored.scoringVersion}, ${sql.json(scored.summary)}, ${sql.json(scored.quality)}
        )
        returning id
      `;
      if (!result) throw new Error("Result insert returned no row.");

      for (const score of scored.scores) {
        await sql`
          insert into public.dimension_scores (
            result_id, construct_key, raw_score, normalized_score, confidence
          )
          values (
            ${result.id}, ${score.constructKey}, ${score.rawScore},
            ${score.normalizedScore}, ${score.confidence}
          )
        `;
      }
      await sql`
        update public.test_sessions
        set status = 'completed', completed_at = now()
        where id = ${session.id}
      `;
      return { resultId: result.id };
    }),
  );
}

export async function getResultByHash(resultTokenHash: string): Promise<PrivateResultView | null> {
  return getPrivateResult(resultTokenHash);
}

export async function getSharedResultByHash(
  shareTokenHash: string,
): Promise<SafeSharedResultView | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [share] = await sql<
      { expires_at: Date; public_scope: string; result_token_hash: string }[]
    >`
      select
        result_share_tokens.expires_at,
        result_share_tokens.public_scope,
        personality_results.result_token_hash
      from public.result_share_tokens
      inner join public.personality_results
        on personality_results.id = result_share_tokens.result_id
      where result_share_tokens.token_hash = ${shareTokenHash}
        and result_share_tokens.revoked_at is null
        and result_share_tokens.expires_at > now()
        and personality_results.deleted_at is null
      limit 1
    `;
    if (!share || !isPublicShareScope(share.public_scope)) return null;

    const privateResult = await getPrivateResult(share.result_token_hash);
    if (!privateResult) return null;
    return toSafeSharedResultView(privateResult, share.public_scope, {
      expiresAt: share.expires_at.toISOString(),
      scope: share.public_scope,
    });
  });
}

async function getPrivateResult(tokenHash: string): Promise<PrivateResultView | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    type StoredResult = {
      created_at: Date;
      id: string;
      quality_json: LegacyResultView["quality"] | ModularResultView["quality"];
      scoring_version: string;
      summary_json: ProfileSummary | ModularResultView["summary"];
    };
    const resultRows = await sql<StoredResult[]>`
      select id, scoring_version, summary_json, quality_json, created_at
      from public.personality_results
      where result_token_hash = ${tokenHash} and deleted_at is null
      limit 1
    `;
    const result = resultRows[0];
    if (!result) return null;

    if (result.scoring_version === "modular-result-1") {
      const moduleRows = await sql<
        {
          ambiguity_json: IndependentModuleResult["ambiguity"];
          confidence: string;
          evidence_tier: IndependentModuleResult["evidenceTier"];
          id: string;
          module_key: string;
          quality_json: IndependentModuleResult["quality"];
          scoring_version: string;
          summary_json: IndependentModuleResult["summary"];
        }[]
      >`
        select id, module_key, scoring_version, evidence_tier, confidence::text,
          ambiguity_json, summary_json, quality_json
        from public.result_modules
        where result_id = ${result.id}
        order by created_at, module_key
      `;
      const modules: IndependentModuleResult[] = [];
      for (const moduleRow of moduleRows) {
        const scores = await sql<
          {
            confidence: string;
            construct_key: string;
            facet_key: string;
            normalized_score: string;
            raw_score: string;
          }[]
        >`
          select construct_key, facet_key, raw_score::text,
            normalized_score::text, confidence::text
          from public.result_module_scores
          where result_module_id = ${moduleRow.id}
          order by construct_key, facet_key
        `;
        modules.push({
          ambiguity: moduleRow.ambiguity_json,
          confidence: Number(moduleRow.confidence),
          evidenceTier: moduleRow.evidence_tier,
          moduleKey: moduleRow.module_key,
          quality: moduleRow.quality_json,
          scores: scores.map((score) => ({
            confidence: Number(score.confidence),
            constructKey: score.construct_key,
            facetKey: score.facet_key,
            normalizedScore: Number(score.normalized_score),
            rawScore: Number(score.raw_score),
          })),
          scoringVersion: moduleRow.scoring_version,
          summary: moduleRow.summary_json,
        });
      }
      const correlationRows = await sql<
        {
          confidence: string;
          kind: string;
          narrative_key: string;
          rule_key: string;
          source_module_keys: string[];
        }[]
      >`
        select result_correlations.rule_key, result_correlations.kind,
          result_correlations.confidence::text, result_correlations.narrative_key,
          coalesce(
            array_agg(result_modules.module_key order by result_modules.module_key)
              filter (where result_modules.module_key is not null),
            array[]::text[]
          ) as source_module_keys
        from public.result_correlations
        left join public.result_correlation_sources
          on result_correlation_sources.correlation_id = result_correlations.id
        left join public.result_modules
          on result_modules.id = result_correlation_sources.result_module_id
        where result_correlations.result_id = ${result.id}
        group by result_correlations.id
        order by result_correlations.rule_key
      `;
      return {
        correlations: correlationRows.map((correlation) => ({
          confidence: Number(correlation.confidence),
          kind: correlation.kind,
          narrativeKey: correlation.narrative_key,
          ruleKey: correlation.rule_key,
          sourceModuleKeys: correlation.source_module_keys,
        })),
        createdAt: result.created_at.toISOString(),
        kind: "modular",
        modules,
        quality: result.quality_json as ModularResultView["quality"],
        summary: result.summary_json as ModularResultView["summary"],
      };
    }

    const scores = await sql<
      { confidence: string; construct_key: TraitKey; normalized_score: string; raw_score: string }[]
    >`
      select construct_key, raw_score::text, normalized_score::text, confidence::text
      from public.dimension_scores
      where result_id = ${result.id}
      order by construct_key
    `;
    return {
      createdAt: result.created_at.toISOString(),
      kind: "legacy",
      quality: result.quality_json as LegacyResultView["quality"],
      scores: scores.map((score) => ({
        confidence: Number(score.confidence),
        constructKey: score.construct_key,
        normalizedScore: Number(score.normalized_score),
        rawScore: Number(score.raw_score),
      })),
      summary: result.summary_json as ProfileSummary,
    };
  });
}

export async function createResultShare(input: {
  expiresAt: Date;
  resultTokenHash: string;
  shareTokenHash: string;
}): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      insert into public.result_share_tokens (result_id, token_hash, expires_at)
      select id, ${input.shareTokenHash}, ${input.expiresAt}
      from public.personality_results
      where result_token_hash = ${input.resultTokenHash} and deleted_at is null
    `;
    return rows.count > 0;
  });
}

export async function revokeResultShares(resultTokenHash: string): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      update public.result_share_tokens
      set revoked_at = now()
      where result_id = (
        select id from public.personality_results
        where result_token_hash = ${resultTokenHash} and deleted_at is null
      ) and revoked_at is null
    `;
    return rows.count > 0;
  });
}

export async function listAccountResultSummaries(
  accountId: string,
): Promise<AccountResultSummary[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        created_at: Date;
        scoring_version: string;
        summary_json: ProfileSummary | ModularResultView["summary"];
      }[]
    >`
      select summary_json, scoring_version, created_at
      from public.personality_results
      where account_id = ${accountId} and deleted_at is null
      order by created_at desc
      limit 20
    `;
    return rows.map((row) => ({
      archetype:
        row.scoring_version === "modular-result-1"
          ? `Hasil modular (${(row.summary_json as ModularResultView["summary"]).moduleKeys.join(", ")})`
          : (row.summary_json as ProfileSummary).archetype,
      createdAt: row.created_at.toISOString(),
      scoringVersion: row.scoring_version,
    }));
  });
}

export async function createResultFeedback(input: {
  message: string | null;
  rating: number;
  resultTokenHash: string;
}): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      insert into public.feedback (result_id, rating, message)
      select id, ${input.rating}, ${input.message}
      from public.personality_results
      where result_token_hash = ${input.resultTokenHash} and deleted_at is null
    `;
    return rows.count > 0;
  });
}

export async function deleteResultByHash(resultTokenHash: string): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      delete from public.test_sessions
      where id = (
        select session_id from public.personality_results
        where result_token_hash = ${resultTokenHash} and deleted_at is null
      )
    `;
    return rows.count > 0;
  });
}

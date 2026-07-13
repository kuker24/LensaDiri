import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
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

export type ResultView = {
  createdAt: string;
  quality: { answeredItems: number; confidence: number; straightLineWarning: boolean };
  scores: TraitScore[];
  summary: ProfileSummary;
};

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

export async function completeAssessment(input: {
  resultTokenHash: string;
  sessionTokenHash: string;
}): Promise<{ resultId: string } | null> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [session] = await sql<
        { account_id: string | null; id: string; mode: AssessmentMode }[]
      >`
        select id, account_id, mode
        from public.test_sessions
        where session_token_hash = ${input.sessionTokenHash}
          and status = 'active'
          and expires_at > now()
        for update
      `;
      if (!session) return null;

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
          and (${session.mode}::public.assessment_mode = 'standard' or questions.quick_enabled)
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

export async function getResultByHash(resultTokenHash: string): Promise<ResultView | null> {
  return getResult("result", resultTokenHash);
}

export async function getSharedResultByHash(shareTokenHash: string): Promise<ResultView | null> {
  return getResult("share", shareTokenHash);
}

async function getResult(kind: "result" | "share", tokenHash: string): Promise<ResultView | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const resultRows =
      kind === "result"
        ? await sql<
            {
              created_at: Date;
              id: string;
              quality_json: ResultView["quality"];
              summary_json: ProfileSummary;
            }[]
          >`
            select id, summary_json, quality_json, created_at
            from public.personality_results
            where result_token_hash = ${tokenHash} and deleted_at is null
            limit 1
          `
        : await sql<
            {
              created_at: Date;
              id: string;
              quality_json: ResultView["quality"];
              summary_json: ProfileSummary;
            }[]
          >`
            select personality_results.id, summary_json, quality_json, personality_results.created_at
            from public.result_share_tokens
            inner join public.personality_results
              on personality_results.id = result_share_tokens.result_id
            where result_share_tokens.token_hash = ${tokenHash}
              and result_share_tokens.revoked_at is null
              and result_share_tokens.expires_at > now()
              and personality_results.deleted_at is null
            limit 1
          `;
    const result = resultRows[0];
    if (!result) return null;
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
      quality: result.quality_json,
      scores: scores.map((score) => ({
        confidence: Number(score.confidence),
        constructKey: score.construct_key,
        normalizedScore: Number(score.normalized_score),
        rawScore: Number(score.raw_score),
      })),
      summary: result.summary_json,
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
      { created_at: Date; scoring_version: string; summary_json: ProfileSummary }[]
    >`
      select summary_json, scoring_version, created_at
      from public.personality_results
      where account_id = ${accountId} and deleted_at is null
      order by created_at desc
      limit 20
    `;
    return rows.map((row) => ({
      archetype: row.summary_json.archetype,
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

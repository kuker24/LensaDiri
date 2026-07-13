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

export type AssessmentMode = "quick" | "standard";

export type AssessmentQuestion = {
  answer: number | null;
  id: string;
  order: number;
  text: string;
};

export type AssessmentSessionView = {
  answeredCount: number;
  mode: AssessmentMode;
  questions: AssessmentQuestion[];
  status: "active" | "completed" | "expired";
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
      { id: string; mode: AssessmentMode; status: "active" | "completed" | "expired" }[]
    >`
      select id, mode, status
      from public.test_sessions
      where session_token_hash = ${sessionTokenHash}
        and expires_at > now()
      limit 1
    `;
    if (!session) return null;

    const questions = await sql<
      { answer: number | null; display_order: number; id: string; public_text: string }[]
    >`
      select
        questions.id,
        questions.public_text,
        questions.display_order,
        user_answers.raw_value as answer
      from public.questions
      left join public.user_answers
        on user_answers.question_id = questions.id
        and user_answers.session_id = ${session.id}
      inner join public.test_sessions
        on test_sessions.id = ${session.id}
        and test_sessions.module_version_id = questions.module_version_id
      where questions.status = 'active'
        and (${session.mode}::public.assessment_mode = 'standard' or questions.quick_enabled)
      order by questions.display_order
    `;

    return {
      answeredCount: questions.filter((question) => question.answer !== null).length,
      mode: session.mode,
      questions: questions.map((question) => ({
        answer: question.answer,
        id: question.id,
        order: question.display_order,
        text: question.public_text,
      })),
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
      inner join public.questions
        on questions.module_version_id = test_sessions.module_version_id
      where test_sessions.session_token_hash = ${input.sessionTokenHash}
        and test_sessions.status = 'active'
        and test_sessions.expires_at > now()
        and questions.id = ${input.questionId}::uuid
        and questions.status = 'active'
        and (test_sessions.mode = 'standard' or questions.quick_enabled)
      on conflict (session_id, question_id) do update set
        raw_value = excluded.raw_value,
        response_time_ms = excluded.response_time_ms,
        idempotency_key = excluded.idempotency_key,
        answered_at = excluded.answered_at
    `;
    return rows.count > 0;
  });
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

import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

export interface AccountSessionSummary {
  readonly answeredCount: number;
  readonly currentSegmentIndex: number;
  readonly id: string;
  readonly mode: "quick" | "standard" | "deep";
  readonly moduleKeys: readonly string[];
  readonly segmentCount: number;
  readonly selectionType: string;
  readonly status: "active" | "paused" | "clarifier_required";
  readonly totalCount: number;
  readonly updatedAt: string;
}

export interface AccountDashboardResultSummary {
  readonly activeShareCount: number;
  readonly createdAt: string;
  readonly id: string;
  readonly moduleKeys: readonly string[];
  readonly scoringVersion: string;
}

export async function listAccountActiveSessions(accountId: string): Promise<AccountSessionSummary[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        answered_count: number;
        current_segment_index: number;
        id: string;
        last_activity_at: Date;
        mode: AccountSessionSummary["mode"];
        module_keys: string[];
        segment_count: number;
        selection_type: string;
        status: AccountSessionSummary["status"];
        total_count: number;
      }[]
    >`
      select
        test_sessions.id,
        test_sessions.mode,
        test_sessions.status,
        test_sessions.selection_type::text,
        test_sessions.current_segment_index,
        test_sessions.last_activity_at,
        coalesce(assessment_blueprints.item_count,
          case when test_sessions.mode = 'quick' then 40 else 60 end
        )::integer as total_count,
        coalesce(assessment_blueprints.segment_count, 1)::integer as segment_count,
        (select count(*)::integer from public.user_answers where session_id = test_sessions.id) as answered_count,
        coalesce(
          array(
            select modules.key
            from public.test_session_modules
            inner join public.module_versions on module_versions.id = test_session_modules.module_version_id
            inner join public.modules on modules.id = module_versions.module_id
            where test_session_modules.session_id = test_sessions.id
            order by modules.default_order
          ),
          array['trait_profile']::text[]
        ) as module_keys
      from public.test_sessions
      left join public.assessment_blueprints on assessment_blueprints.id = test_sessions.blueprint_id
      where test_sessions.account_id = ${accountId}
        and test_sessions.status in ('active', 'paused', 'clarifier_required')
        and test_sessions.expires_at > now()
      order by test_sessions.last_activity_at desc
      limit 20
    `;

    return rows.map((row) => ({
      answeredCount: row.answered_count,
      currentSegmentIndex: row.current_segment_index,
      id: row.id,
      mode: row.mode,
      moduleKeys: row.module_keys.length > 0 ? row.module_keys : ["trait_profile"],
      segmentCount: row.segment_count,
      selectionType: row.selection_type,
      status: row.status,
      totalCount: row.total_count,
      updatedAt: row.last_activity_at.toISOString(),
    }));
  });
}

export async function listAccountDashboardResults(
  accountId: string,
): Promise<AccountDashboardResultSummary[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        active_share_count: number;
        created_at: Date;
        id: string;
        module_keys: string[];
        scoring_version: string;
      }[]
    >`
      select
        personality_results.id,
        personality_results.scoring_version,
        personality_results.created_at,
        coalesce(
          array_agg(result_modules.module_key order by result_modules.created_at)
            filter (where result_modules.module_key is not null),
          array['trait_profile']::text[]
        ) as module_keys,
        (
          select count(*)::integer
          from public.result_share_tokens
          where result_share_tokens.result_id = personality_results.id
            and result_share_tokens.revoked_at is null
            and result_share_tokens.expires_at > now()
        ) as active_share_count
      from public.personality_results
      left join public.result_modules on result_modules.result_id = personality_results.id
      where personality_results.account_id = ${accountId}
        and personality_results.deleted_at is null
      group by personality_results.id
      order by personality_results.created_at desc
      limit 50
    `;

    return rows.map((row) => ({
      activeShareCount: row.active_share_count,
      createdAt: row.created_at.toISOString(),
      id: row.id,
      moduleKeys: row.module_keys,
      scoringVersion: row.scoring_version,
    }));
  });
}

export async function rotateAccountSessionToken(input: {
  accountId: string;
  sessionId: string;
  sessionTokenHash: string;
}): Promise<boolean> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const rows = await sql`
        update public.test_sessions
        set
          session_token_hash = ${input.sessionTokenHash},
          status = case when status = 'paused' then 'active'::public.assessment_status else status end,
          paused_at = case when status = 'paused' then null else paused_at end,
          last_activity_at = now()
        where id = ${input.sessionId}::uuid
          and account_id = ${input.accountId}::uuid
          and status in ('active', 'paused', 'clarifier_required')
          and expires_at > now()
      `;
      if (rows.count === 0) return false;

      await sql`
        update public.test_session_segments
        set status = 'active', paused_at = null, started_at = coalesce(started_at, now())
        where session_id = ${input.sessionId}::uuid and status = 'paused'
      `;
      await sql`
        insert into public.audit_logs (actor_account_id, action, entity_type, entity_id, metadata_json)
        values (${input.accountId}, 'assessment_resumed', 'assessment_session', ${input.sessionId}, '{"source":"dashboard"}'::jsonb)
      `;
      return true;
    }),
  );
}

export async function rotateAccountResultToken(input: {
  accountId: string;
  resultId: string;
  resultTokenHash: string;
}): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      update public.personality_results
      set result_token_hash = ${input.resultTokenHash}
      where id = ${input.resultId}::uuid
        and account_id = ${input.accountId}::uuid
        and deleted_at is null
    `;
    return rows.count > 0;
  });
}

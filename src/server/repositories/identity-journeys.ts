import "server-only";

import type { TransactionSql } from "postgres";

import {
  buildCollectibleIdentity,
  identityJourneyPlan,
  type IdentityJourneyModuleKey,
  type IdentityJourneyStepStatus,
} from "@/lib/assessment/identity-journey";
import { getDatabase } from "@/lib/db/client";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";
import { runDatabaseOperation } from "@/server/database";

export type IdentityJourneyView = Readonly<{
  artifacts: ReadonlyArray<{
    moduleKey: IdentityJourneyModuleKey;
    summary: Readonly<Record<string, unknown>>;
  }>;
  characterGender: "perempuan" | "laki";
  complete: boolean;
  currentPosition: number;
  identity: ReturnType<typeof buildCollectibleIdentity>;
  steps: ReadonlyArray<{
    moduleKey: IdentityJourneyModuleKey;
    position: number;
    required: boolean;
    status: IdentityJourneyStepStatus;
  }>;
}>;

/**
 * Creates a journey whose five steps are all claimed by one session.
 *
 * The combined flow runs every lens in a single Complex sitting, so there is no
 * sequential promotion: all five steps start `active` against the same session,
 * and `attachJourneyResultInTransaction` completes them together. This is what
 * `202609130001_combined_identity_journey.sql` relaxed the per-table unique
 * constraints for.
 */
export async function createCombinedIdentityJourneyInTransaction(
  sql: TransactionSql,
  input: {
    accountId: string | null;
    characterGender: "perempuan" | "laki";
    expiresAt: Date;
    journeyTokenHash: string;
    sessionId: string;
  },
): Promise<string> {
  const [journey] = await sql<{ id: string }[]>`
    insert into public.identity_journeys (
      account_id, journey_token_hash, character_gender, expires_at, current_position
    ) values (
      ${input.accountId}, ${input.journeyTokenHash}, ${input.characterGender},
      ${input.expiresAt}, ${identityJourneyPlan.length}
    ) returning id
  `;
  if (!journey) throw new Error("Combined identity journey insert returned no row.");

  const startedAt = new Date();
  await sql`
    insert into public.identity_journey_steps ${sql(
      identityJourneyPlan.map((step) => ({
        completed_at: null,
        journey_id: journey.id,
        module_key: step.moduleKey,
        position: step.position,
        required: step.required,
        result_id: null,
        session_id: input.sessionId,
        started_at: startedAt,
        status: "active",
      })),
    )}
  `;
  return journey.id;
}

export async function createIdentityJourneyInTransaction(
  sql: TransactionSql,
  input: {
    accountId: string | null;
    characterGender: "perempuan" | "laki";
    expiresAt: Date;
    journeyTokenHash: string;
    sessionId: string;
  },
): Promise<string> {
  const [journey] = await sql<{ id: string }[]>`
    insert into public.identity_journeys (
      account_id, journey_token_hash, character_gender, expires_at
    ) values (
      ${input.accountId}, ${input.journeyTokenHash}, ${input.characterGender}, ${input.expiresAt}
    ) returning id
  `;
  if (!journey) throw new Error("Identity journey insert returned no row.");

  await sql`
    insert into public.identity_journey_steps ${sql(
      identityJourneyPlan.map((step) => ({
        completed_at: null,
        journey_id: journey.id,
        module_key: step.moduleKey,
        position: step.position,
        required: step.required,
        result_id: null,
        session_id: step.position === 1 ? input.sessionId : null,
        started_at: step.position === 1 ? new Date() : null,
        status: step.position === 1 ? "active" : "locked",
      })),
    )}
  `;
  return journey.id;
}

export type AvailableJourneyStep =
  | Readonly<{ moduleKey: IdentityJourneyModuleKey; success: true }>
  | Readonly<{ code: "journey_owner_mismatch" | "journey_step_unavailable"; success: false }>;

/**
 * Resolves the single startable step. Ownership is checked here, in the same
 * query that resolves the module, so an account context change becomes a
 * deterministic client error instead of surfacing later as a 500 from
 * `activateJourneyStepInTransaction`.
 */
export async function getAvailableJourneyModuleByHash(
  journeyTokenHash: string,
  accountId: string | null,
): Promise<AvailableJourneyStep> {
  return runDatabaseOperation(async () => {
    const [step] = await getDatabase()<
      { module_key: IdentityJourneyModuleKey; owner_matches: boolean }[]
    >`
      select identity_journey_steps.module_key,
        identity_journeys.account_id is not distinct from ${accountId} as owner_matches
      from public.identity_journey_steps
      inner join public.identity_journeys on identity_journeys.id = identity_journey_steps.journey_id
      where identity_journeys.journey_token_hash = ${journeyTokenHash}
        and identity_journeys.status = 'active' and identity_journeys.expires_at > now()
        and identity_journey_steps.status = 'available'
      order by identity_journey_steps.position
      limit 1
    `;
    if (!step) return { code: "journey_step_unavailable", success: false } as const;
    if (!step.owner_matches) return { code: "journey_owner_mismatch", success: false } as const;
    return { moduleKey: step.module_key, success: true } as const;
  });
}

export async function activateJourneyStepInTransaction(
  sql: TransactionSql,
  input: {
    accountId: string | null;
    journeyTokenHash: string;
    moduleKey: string;
    sessionId: string;
  },
): Promise<void> {
  const [step] = await sql<{ id: string; journey_id: string }[]>`
    select identity_journey_steps.id, identity_journey_steps.journey_id
    from public.identity_journey_steps
    inner join public.identity_journeys on identity_journeys.id = identity_journey_steps.journey_id
    where identity_journeys.journey_token_hash = ${input.journeyTokenHash}
      and identity_journeys.status = 'active' and identity_journeys.expires_at > now()
      and identity_journeys.account_id is not distinct from ${input.accountId}
      and identity_journey_steps.module_key = ${input.moduleKey}
      and identity_journey_steps.status = 'available'
    for update of identity_journey_steps, identity_journeys
  `;
  if (!step) throw new RangeError("Journey step is not available.");
  await sql`
    update public.identity_journey_steps
    set status = 'active', session_id = ${input.sessionId}, started_at = now()
    where id = ${step.id}
  `;
  await sql`
    update public.identity_journeys set last_activity_at = now() where id = ${step.journey_id}
  `;
}

export async function attachJourneyResultInTransaction(
  sql: TransactionSql,
  input: { resultId: string; sessionId: string },
): Promise<void> {
  const steps = await sql<{ journey_id: string; position: number }[]>`
    select journey_id, position
    from public.identity_journey_steps
    where session_id = ${input.sessionId} and status = 'active'
    order by position
    for update
  `;
  const step = steps[0];
  if (!step) return;

  await sql`
    update public.identity_journey_steps
    set status = 'completed', result_id = ${input.resultId}, completed_at = now()
    where session_id = ${input.sessionId} and status = 'active'
  `;
  // A combined sitting claims every step with one session, so completing it
  // finishes the journey outright and leaves nothing to unlock. Only a
  // sequential run, which owns exactly one active step, has a next position.
  const combined = steps.length > 1;
  const nextPosition = step.position + 1;
  if (!combined && nextPosition <= identityJourneyPlan.length) {
    await sql`
      update public.identity_journey_steps
      set status = 'available'
      where journey_id = ${step.journey_id} and position = ${nextPosition} and status = 'locked'
    `;
    await sql`
      update public.identity_journeys
      set current_position = ${nextPosition}, last_activity_at = now()
      where id = ${step.journey_id} and status = 'active'
    `;
    return;
  }
  await sql`
    update public.identity_journeys
    set status = 'completed', completed_at = now(), last_activity_at = now(), current_position = 5
    where id = ${step.journey_id} and status = 'active'
  `;
}

/**
 * True only when the result token belongs to a completed identity-journey step.
 * The product cutover uses this at the request boundary; the result repository
 * itself stays honest about what the database still contains.
 */
export async function isJourneyAttachedResultHash(resultTokenHash: string): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const [row] = await getDatabase()<{ attached: boolean }[]>`
      select true as attached
      from public.identity_journey_steps
      inner join public.personality_results
        on personality_results.id = identity_journey_steps.result_id
      where personality_results.result_token_hash = ${resultTokenHash}
        and personality_results.deleted_at is null
      limit 1
    `;
    return row?.attached === true;
  });
}

/** Share-token counterpart of `isJourneyAttachedResultHash`, for the public card. */
export async function isJourneyAttachedShareHash(shareTokenHash: string): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const [row] = await getDatabase()<{ attached: boolean }[]>`
      select true as attached
      from public.result_share_tokens
      inner join public.personality_results
        on personality_results.id = result_share_tokens.result_id
      inner join public.identity_journey_steps
        on identity_journey_steps.result_id = personality_results.id
      where result_share_tokens.token_hash = ${shareTokenHash}
        and personality_results.deleted_at is null
      limit 1
    `;
    return row?.attached === true;
  });
}

export async function getIdentityJourneyByHash(
  journeyTokenHash: string,
): Promise<IdentityJourneyView | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [journey] = await sql<
      {
        character_gender: "perempuan" | "laki";
        current_position: number;
        id: string;
        status: "active" | "completed" | "revoked";
      }[]
    >`
      select id, character_gender, current_position, status
      from public.identity_journeys
      where journey_token_hash = ${journeyTokenHash}
        and status in ('active', 'completed') and expires_at > now()
      limit 1
    `;
    if (!journey) return null;
    const steps = await sql<
      {
        module_key: IdentityJourneyModuleKey;
        position: number;
        required: boolean;
        status: IdentityJourneyStepStatus;
        summary_json: Record<string, unknown> | null;
      }[]
    >`
      select identity_journey_steps.module_key, identity_journey_steps.position,
        identity_journey_steps.required, identity_journey_steps.status,
        result_modules.summary_json
      from public.identity_journey_steps
      left join public.result_modules on result_modules.result_id = identity_journey_steps.result_id
        and result_modules.module_key = identity_journey_steps.module_key
      where identity_journey_steps.journey_id = ${journey.id}
      order by identity_journey_steps.position
    `;
    const modules = steps
      .filter((step) => step.status === "completed" && step.summary_json)
      .map(
        (step) =>
          ({ moduleKey: step.module_key, summary: step.summary_json }) as IndependentModuleResult,
      );
    const complete = identityJourneyPlan.every((planned) =>
      modules.some((module) => module.moduleKey === planned.moduleKey),
    );
    return {
      artifacts: modules.map((module) => ({
        moduleKey: module.moduleKey as IdentityJourneyModuleKey,
        summary: module.summary,
      })),
      characterGender: journey.character_gender,
      complete,
      currentPosition: journey.current_position,
      identity: buildCollectibleIdentity(modules),
      steps: steps.map(({ module_key, position, required, status }) => ({
        moduleKey: module_key,
        position,
        required,
        status,
      })),
    };
  });
}

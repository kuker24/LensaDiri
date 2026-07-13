import "server-only";

import { getDatabase } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

export const consentTypes = [
  "assessment_processing",
  "result_storage",
  "research_optional",
  "marketing_optional",
  "ai_feature_optional",
] as const;

export type ConsentType = (typeof consentTypes)[number];

export type ConsentSubject =
  { accountId: string; sessionId?: never } | { accountId?: never; sessionId: string };

export async function createConsentRecord(input: {
  accepted: boolean;
  consentType: ConsentType;
  subject: ConsentSubject;
  version: string;
}): Promise<{ id: string }> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [consent] = await sql<{ id: string }[]>`
      insert into public.consents (
        account_id,
        session_id,
        consent_type,
        version,
        accepted_at,
        rejected_at
      )
      values (
        ${input.subject.accountId ?? null},
        ${input.subject.sessionId ?? null},
        ${input.consentType},
        ${input.version},
        case when ${input.accepted} then now() else null end,
        case when ${input.accepted} then null else now() end
      )
      returning id
    `;

    if (!consent) {
      throw new Error("Consent insert returned no row.");
    }

    return consent;
  });
}

export async function revokeConsentRecord(
  consentId: string,
  revokedAt = new Date(),
): Promise<boolean> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql`
      update public.consents
      set revoked_at = ${revokedAt}
      where id = ${consentId}
        and accepted_at is not null
        and revoked_at is null
    `;
    return rows.count > 0;
  });
}

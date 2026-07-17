import "server-only";

import { getDatabase, withTransaction } from "@/lib/db/client";
import type { ConsentType } from "@/server/repositories/consents";
import { runDatabaseOperation } from "@/server/database";

export interface AccountConsentPolicyView {
  readonly consentType: ConsentType;
  readonly decision: "accepted" | "rejected" | "not_set";
  readonly deletionAction: "hard_delete" | "rolling_cleanup" | "user_controlled";
  readonly purpose: string;
  readonly requiredForCore: boolean;
  readonly retentionDays: number | null;
  readonly retentionSubject: string;
  readonly version: string;
}

export async function listAccountConsentPolicies(
  accountId: string,
): Promise<AccountConsentPolicyView[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        accepted_at: Date | null;
        consent_type: ConsentType;
        deletion_action: AccountConsentPolicyView["deletionAction"];
        purpose: string;
        rejected_at: Date | null;
        required_for_core: boolean;
        retention_days: number | null;
        retention_subject: string;
        revoked_at: Date | null;
        version: string;
      }[]
    >`
      select
        consent_policy_versions.consent_type,
        consent_policy_versions.version,
        consent_policy_versions.purpose,
        consent_policy_versions.required_for_core,
        retention_policies.subject as retention_subject,
        retention_policies.retention_days,
        retention_policies.deletion_action,
        latest.accepted_at,
        latest.rejected_at,
        latest.revoked_at
      from public.consent_policy_versions
      inner join public.retention_policies
        on retention_policies.key = consent_policy_versions.retention_policy_key
      left join lateral (
        select accepted_at, rejected_at, revoked_at
        from public.consents
        where consents.account_id = ${accountId}::uuid
          and consents.consent_type = consent_policy_versions.consent_type
          and consents.version = consent_policy_versions.version
        order by consents.created_at desc, consents.id desc
        limit 1
      ) as latest on true
      where consent_policy_versions.status = 'published'
      order by
        consent_policy_versions.required_for_core desc,
        consent_policy_versions.consent_type
    `;

    return rows.map((row) => ({
      consentType: row.consent_type,
      decision:
        row.accepted_at && !row.revoked_at
          ? "accepted"
          : row.rejected_at || row.revoked_at
            ? "rejected"
            : "not_set",
      deletionAction: row.deletion_action,
      purpose: row.purpose,
      requiredForCore: row.required_for_core,
      retentionDays: row.retention_days,
      retentionSubject: row.retention_subject,
      version: row.version,
    }));
  });
}

export async function recordAccountOptionalConsent(input: {
  accepted: boolean;
  accountId: string;
  consentType: ConsentType;
  version: string;
}): Promise<boolean> {
  return runDatabaseOperation(() =>
    withTransaction(async (sql) => {
      const [policy] = await sql<{ required_for_core: boolean }[]>`
        select required_for_core
        from public.consent_policy_versions
        where consent_type = ${input.consentType}
          and version = ${input.version}
          and status = 'published'
        for share
      `;
      if (!policy || policy.required_for_core) return false;

      const [consent] = await sql<{ id: string }[]>`
        insert into public.consents (
          account_id, consent_type, version, accepted_at, rejected_at
        ) values (
          ${input.accountId}, ${input.consentType}, ${input.version},
          case when ${input.accepted} then now() else null end,
          case when ${input.accepted} then null else now() end
        )
        returning id
      `;
      if (!consent) return false;

      await sql`
        insert into public.audit_logs (
          actor_account_id, action, entity_type, entity_id, metadata_json
        ) values (
          ${input.accountId}, 'consent_recorded', 'consent', ${consent.id},
          ${sql.json({ accepted: input.accepted, consentType: input.consentType, version: input.version })}
        )
      `;
      return true;
    }),
  );
}

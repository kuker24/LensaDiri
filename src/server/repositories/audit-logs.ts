import "server-only";

import { getDatabase } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

export type AuditAction =
  | "account_registered"
  | "account_login_succeeded"
  | "account_login_failed"
  | "account_logout"
  | "account_session_revoked"
  | "consent_recorded"
  | "consent_revoked"
  | "admin_accessed"
  | "admin_content_changed";

export type AuditEntityType =
  "account" | "account_session" | "consent" | "admin_resource" | "system";
export type AuditMetadata = Partial<Record<"outcome" | "source" | "reason", string>>;

export async function createAuditLog(input: {
  action: AuditAction;
  actorAccountId: string | null;
  entityId: string | null;
  entityType: AuditEntityType;
  metadata?: AuditMetadata;
}): Promise<void> {
  await runDatabaseOperation(async () => {
    const sql = getDatabase();
    const metadata = Object.fromEntries(
      Object.entries(input.metadata ?? {}).filter(([, value]) => value !== undefined),
    );
    await sql`
      insert into public.audit_logs (actor_account_id, action, entity_type, entity_id, metadata_json)
      values (${input.actorAccountId}, ${input.action}, ${input.entityType}, ${input.entityId}, ${sql.json(metadata)})
    `;
  });
}

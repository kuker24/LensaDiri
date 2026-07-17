import "server-only";

import { createAuditLog } from "@/server/repositories/audit-logs";
import {
  createConsentRecord,
  revokeConsentRecord,
  type ConsentSubject,
  type ConsentType,
} from "@/server/repositories/consents";

export async function recordConsent(input: {
  accepted: boolean;
  consentType: ConsentType;
  subject: ConsentSubject;
  version: string;
}): Promise<{ id: string }> {
  const consent = await createConsentRecord(input);
  const accountId = "accountId" in input.subject ? input.subject.accountId : null;

  await createAuditLog({
    action: "consent_recorded",
    actorAccountId: accountId,
    entityId: consent.id,
    entityType: "consent",
    metadata: { outcome: input.accepted ? "accepted" : "rejected" },
  });

  return consent;
}

export async function revokeConsent(
  consentId: string,
  actorAccountId: string | null,
): Promise<boolean> {
  const revoked = await revokeConsentRecord(consentId);
  if (revoked) {
    await createAuditLog({
      action: "consent_revoked",
      actorAccountId,
      entityId: consentId,
      entityType: "consent",
      metadata: { outcome: "revoked" },
    });
  }
  return revoked;
}

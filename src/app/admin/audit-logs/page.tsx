import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { ADMIN_LIST_LIMIT, listAdminAuditLogs } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminAuditLogsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const rows = await listAdminAuditLogs();
  return (
    <AdminSectionPage
      description={`Audit log terbaru (maks ${ADMIN_LIST_LIMIT}). Metadata allowlist: outcome/source/reason saja.`}
      items={rows.map((row) => {
        const meta = Object.entries(row.metadata)
          .map(([key, value]) => `${key}=${value}`)
          .join(" ");
        return {
          label: `${row.createdAt} · ${row.action}`,
          value: [
            row.entityType,
            row.actorAccountId ? `actor ${row.actorAccountId}` : "actor none",
            meta || "meta none",
          ].join(" · "),
        };
      })}
      title="Audit Logs"
    />
  );
}

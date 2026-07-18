import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminAuditLogsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Log perubahan dan akses sensitive. Audit log wajib dirotasi secara berkala."
      items={[]}
      title="Audit Logs"
    />
  );
}

import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { ADMIN_LIST_LIMIT, listAdminFeedback } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminFeedbackPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const rows = await listAdminFeedback();
  return (
    <AdminSectionPage
      description={`Feedback terbaru (maks ${ADMIN_LIST_LIMIT}). Tanpa result_id, token, atau identitas pemilik.`}
      items={rows.map((row) => ({
        label: `${row.createdAt} · rating ${row.rating} · ${row.source}`,
        value: row.messagePreview ?? "(tanpa pesan)",
      }))}
      title="Feedback"
    />
  );
}

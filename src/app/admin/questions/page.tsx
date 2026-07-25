import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { listAdminQuestionCounts } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminQuestionsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const counts = await listAdminQuestionCounts();
  return (
    <AdminSectionPage
      description="Jumlah item per versi modul (count only; teks item tidak ditampilkan)."
      items={counts.map((row) => ({
        label: `${row.publicName} · ${row.key}@${row.version}`,
        value: `${row.questionCount} item · ${row.status}`,
      }))}
      title="Pertanyaan"
    />
  );
}

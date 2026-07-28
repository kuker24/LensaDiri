import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { listAdminModuleVersions } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminModuleVersionsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const versions = await listAdminModuleVersions();
  return (
    <AdminSectionPage
      description="Versi modul dari basis data: status, penilaian, bank pertanyaan, dan jumlah item."
      items={versions.map((row) => ({
        label: `${row.key}@${row.version}`,
        value: [
          row.status,
          `penilaian ${row.scoringVersion}`,
          `bank pertanyaan ${row.itemBankVersion}`,
          `${row.questionCount} pertanyaan`,
        ].join(" · "),
      }))}
      title="Versi Modul"
    />
  );
}

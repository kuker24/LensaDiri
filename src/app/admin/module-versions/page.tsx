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
      description="Versi modul dari database: status, scoring, item bank, dan jumlah item."
      items={versions.map((row) => ({
        label: `${row.key}@${row.version}`,
        value: [
          row.status,
          `scoring ${row.scoringVersion}`,
          `bank ${row.itemBankVersion}`,
          `${row.questionCount} item`,
        ].join(" · "),
      }))}
      title="Versi Modul"
    />
  );
}

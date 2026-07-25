import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { listAdminModules } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminModulesPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const modules = await listAdminModules();
  return (
    <AdminSectionPage
      description="Katalog modul dari database (semua status). Bukan daftar hardcode."
      items={modules.map((row) => ({
        label: `${row.publicName} (${row.key})`,
        value: [
          row.status,
          row.releaseDisposition,
          row.isSelectable ? "selectable" : "not-selectable",
          `tier ${row.evidenceTier}`,
          row.latestVersion ? `v ${row.latestVersion}` : "no-version",
        ].join(" · "),
      }))}
      title="Modul"
    />
  );
}

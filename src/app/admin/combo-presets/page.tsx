import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { listAdminComboPresets } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminComboPresetsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const presets = await listAdminComboPresets();
  return (
    <AdminSectionPage
      description="Combo preset dari database (semua status), termasuk draft."
      items={presets.map((row) => ({
        label: `${row.publicName} (${row.key})`,
        value: [
          row.status,
          row.recommendedMode,
          row.isFullSpectrum ? "full-spectrum" : "partial",
          row.moduleKeys.join(", ") || "(no modules)",
        ].join(" · "),
      }))}
      title="Combo Presets"
    />
  );
}

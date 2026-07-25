import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { listAdminBlueprintInventory } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminBlueprintsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const inventory = await listAdminBlueprintInventory();
  return (
    <AdminSectionPage
      description="Inventori blueprint sesi immutable per mode (bukan CMS template). Blueprint dibuat per assessment."
      items={
        inventory.length > 0
          ? inventory.map((row) => ({
              label: `mode ${row.mode}`,
              value: `${row.blueprintCount} blueprint`,
            }))
          : []
      }
      title="Blueprint"
    />
  );
}

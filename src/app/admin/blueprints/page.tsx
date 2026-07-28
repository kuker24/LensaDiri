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
      description="Inventaris cetak biru sesi tetap per mode. Cetak biru dibuat untuk setiap asesmen."
      items={
        inventory.length > 0
          ? inventory.map((row) => ({
              label: `mode ${row.mode}`,
              value: `${row.blueprintCount} cetak biru`,
            }))
          : []
      }
      title="Cetak Biru"
    />
  );
}

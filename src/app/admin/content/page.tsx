import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { listAdminFeatureFlags } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminContentPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const flags = await listAdminFeatureFlags();
  return (
    <AdminSectionPage
      description="CMS konten belum ada. Ditampilkan feature flags database (read-only) sebagai status rilis."
      items={flags.map((row) => ({
        label: row.key,
        value: row.enabled ? "ON" : "OFF",
      }))}
      title="Konten"
    />
  );
}

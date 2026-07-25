import { redirect } from "next/navigation";

import { AdminSectionPage } from "@/components/admin-section-page";
import { listAdminScoringRegistry } from "@/server/repositories/admin-reads";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminScoringVersionsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const rows = listAdminScoringRegistry();
  return (
    <AdminSectionPage
      description="Registry scoring independen di kode (sumber kebenaran engine). Bandingkan dengan scoring_version di versi modul."
      items={rows.map((row) => ({
        label: row.moduleKey,
        value: row.scoringVersion,
      }))}
      title="Scoring Versions"
    />
  );
}

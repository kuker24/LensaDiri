import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminModuleVersionsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Versi konten modul. Setiap rilis baru membutuhkan increment version minor."
      items={[
        { label: "trait_profile", value: "modular-1 · PUBLISHED" },
        { label: "type_16", value: "type16-1 · PUBLISHED" },
        { label: "enneagram", value: "enneagram-1 · PUBLISHED" },
        { label: "temperament", value: "temperament-1 · PUBLISHED" },
        { label: "three_center", value: "DRAFT - v1" },
        { label: "instinct", value: "DRAFT - v1" },
        { label: "socionics_communication", value: "DRAFT - v1" },
        { label: "riasec", value: "DRAFT - v1" },
        { label: "attachment", value: "DRAFT - v1" },
        { label: "psychosophy", value: "DRAFT - v1" },
      ]}
      title="Versi Modul"
    />
  );
}

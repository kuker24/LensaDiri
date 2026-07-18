import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminBlueprintsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Blueprint assessment. Template asesmen modular yang digunakan Test Composer untuk membuat sesi."
      items={[
        { label: "12 Pertanyaan Trait Profile", value: "published" },
        { label: "30 Pertanyaan Enneagram", value: "published" },
        { label: "12 Pertanyaan 16-Type", value: "published" },
        { label: "10 Pertanyaan Temperament", value: "published" },
      ]}
      title="Blueprint"
    />
  );
}

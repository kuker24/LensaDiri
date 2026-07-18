import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminContentPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Konten statis dan konten dinamis pada halaman publik dan hasil."
      items={[]}
      title="Konten"
    />
  );
}

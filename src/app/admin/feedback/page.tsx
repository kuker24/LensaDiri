import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminFeedbackPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Feedback dan rating dari pengguna untuk setiap hasil assessment."
      items={[]}
      title="Feedback"
    />
  );
}

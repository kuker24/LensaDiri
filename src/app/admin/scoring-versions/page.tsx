import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminScoringVersionsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Versi algoritma scoring yang terdaftar di registry."
      items={[
        { label: "trait_profile", value: "trait-profile-modular-1" },
        { label: "type_16", value: "type16-score-1" },
        { label: "enneagram", value: "enneagram-score-1" },
        { label: "temperament", value: "temperament-score-1" },
        { label: "three_center", value: "three-center-score-1" },
        { label: "instinct", value: "instinct-score-1" },
        { label: "socionics_communication", value: "socionics-score-1" },
        { label: "riasec", value: "riasec-score-1" },
        { label: "attachment", value: "attachment-score-1" },
        { label: "psychosophy", value: "psychosophy-score-1" },
      ]}
      title="Scoring Versions"
    />
  );
}

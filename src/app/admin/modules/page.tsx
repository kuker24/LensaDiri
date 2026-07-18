import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminModulesPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Modul assessment yang tersedia dalam katalog. Status public diset melalui database."
      items={[
        { label: "Trait Profile", value: "Published" },
        { label: "16-Type (MBTI Inspired)", value: "Published" },
        { label: "Enneagram", value: "Published" },
        { label: "Temperament", value: "Published" },
        { label: "Three Center", value: "Experimental · Draft" },
        { label: "Instinctual Variant", value: "Experimental · Draft" },
        { label: "Socionics Communication", value: "Experimental · Draft" },
        { label: "RIASEC Interest", value: "Experimental · Draft" },
        { label: "Attachment Reflection", value: "Experimental · Draft" },
        { label: "Psychosophy", value: "Experimental · Draft" },
      ]}
      title="Modul"
    />
  );
}

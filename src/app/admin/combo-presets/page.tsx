import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminComboPresetsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Paket kombinasi modul yang sudah ditentukan (preset) untuk memudahkan pengguna memilih kombinasi assessment."
      items={[
        { label: "Core Self", value: "trait_profile, type_16, enneagram" },
        { label: "Temperament + Enneagram", value: "temperament, enneagram" },
        { label: "Full Personality", value: "trait_profile, type_16, enneagram, temperament" },
      ]}
      title="Combo Presets"
    />
  );
}

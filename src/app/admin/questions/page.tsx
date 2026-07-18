import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";
import { AdminSectionPage } from "@/components/admin-section-page";

export default async function AdminQuestionsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  return (
    <AdminSectionPage
      description="Bank pertanyaan dengan mapping construct, polarity, weight, dan role scoring."
      items={[
        { label: "Trait Profile", value: "10 pertanyaan" },
        { label: "16-Type", value: "10 pertanyaan" },
        { label: "Enneagram", value: "54 pertanyaan" },
        { label: "Temperament", value: "20 pertanyaan" },
        { label: "Three Center", value: "(belum dibuat)" },
        { label: "Instinctual Variant", value: "(belum dibuat)" },
        { label: "Socionics Communication", value: "(belum dibuat)" },
        { label: "RIASEC Interest", value: "(belum dibuat)" },
        { label: "Attachment Reflection", value: "(belum dibuat)" },
        { label: "Psychosophy", value: "(belum dibuat)" },
      ]}
      title="Pertanyaan"
    />
  );
}

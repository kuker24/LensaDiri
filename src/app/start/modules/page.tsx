import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ModularStartForm } from "@/components/modular-start-form";
import { getPublicAssessmentCatalog } from "@/server/public-assessment-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pilih Lensa",
  robots: { follow: false, index: false },
};

export default async function ModularStartPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string }>;
}) {
  const [{ module }, catalog] = await Promise.all([searchParams, getPublicAssessmentCatalog()]);
  if (!catalog) redirect("/start");

  return (
    <section className="task-shell">
      <ModularStartForm
        initialCatalog={{
          modes: catalog.modes,
          modules: catalog.modules,
        }}
        initialCombos={catalog.combos}
        {...(module === undefined ? {} : { initialModuleKey: module })}
      />
    </section>
  );
}

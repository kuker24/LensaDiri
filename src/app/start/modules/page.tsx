import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModularStartForm } from "@/components/modular-start-form";
import { isFeatureEnabled } from "@/server/repositories/catalog";

export const metadata: Metadata = {
  title: "Pilih Lensa",
  robots: { follow: false, index: false },
};

export default async function ModularStartPage() {
  if (!(await isFeatureEnabled("FEATURE_MODULAR_COMPOSER"))) notFound();

  return (
    <section className="container-shell py-12 sm:py-16">
      <ModularStartForm />
    </section>
  );
}

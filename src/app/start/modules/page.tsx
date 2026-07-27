import type { Metadata } from "next";

import { ModularStartForm } from "@/components/modular-start-form";
import { loadModularStartCatalog } from "@/server/services/modular-start-catalog";

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
  const { module } = await searchParams;
  const catalog = await loadModularStartCatalog();

  return (
    <section className="task-shell">
      <ModularStartForm
        {...(module === undefined ? {} : { initialModuleKey: module })}
        {...(catalog
          ? {
              initialCatalog: { modes: catalog.modes, modules: catalog.modules },
              initialCombos: catalog.combos,
            }
          : {})}
      />
    </section>
  );
}

import type { Metadata } from "next";

import { ModularStartForm } from "@/components/modular-start-form";

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

  return (
    <section className="task-shell">
      <ModularStartForm {...(module === undefined ? {} : { initialModuleKey: module })} />
    </section>
  );
}

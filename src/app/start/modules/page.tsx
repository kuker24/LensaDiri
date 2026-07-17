import type { Metadata } from "next";

import { ModularStartForm } from "@/components/modular-start-form";

export const metadata: Metadata = {
  title: "Pilih Lensa",
  robots: { follow: false, index: false },
};

export default function ModularStartPage() {
  return (
    <section className="container-shell py-12 sm:py-16">
      <ModularStartForm />
    </section>
  );
}

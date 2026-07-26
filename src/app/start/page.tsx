import type { Metadata } from "next";
import Link from "next/link";

import { ModularLaunchCard } from "@/components/modular-launch-card";

export const metadata: Metadata = {
  title: "Mulai Eksplorasi",
  robots: { follow: false, index: false },
};

const modes = [
  {
    key: "quick",
    name: "Quick",
    duration: "5 sampai 8 menit",
    items: "40 item",
    description: "Lima spektrum trait dengan confidence ringkas.",
  },
  {
    key: "standard",
    name: "Standard",
    duration: "10 sampai 15 menit",
    items: "60 item",
    description: "Item lebih banyak untuk confidence yang lebih kuat.",
  },
] as const;

export default function StartPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mono-label text-aperture">Mulai / pilih jalur</p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          Pilih kedalaman yang nyaman.
        </h1>
        <p className="text-ink-muted mt-5 text-lg leading-8">
          Keduanya memakai item original LensaDiri, scoring server-side deterministik, dan hasil
          private secara default.
        </p>
      </div>
      <ModularLaunchCard />
      <div className="border-line mx-auto mt-12 max-w-4xl border-t pt-8">
        <h2 className="text-xl font-medium">Tes legacy</h2>
        <p className="text-ink-muted mt-2 text-sm leading-6">
          Quick 40 dan Standard 60 tetap tersedia selama migrasi modular.
        </p>
      </div>
      <div className="border-line mx-auto mt-5 grid max-w-4xl border-y md:grid-cols-2">
        {modes.map((mode) => (
          <article
            className="border-line py-7 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            key={mode.key}
          >
            <h2 className="text-2xl font-medium">{mode.name}</h2>
            <p className="text-ink-muted mt-3 leading-7">{mode.description}</p>
            <p className="mt-5 text-sm">
              <strong>{mode.items}</strong> · {mode.duration}
            </p>
            <Link
              className="focus-ring pressable bg-lens text-canvas mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-md px-5 font-semibold transition-[background-color,transform] duration-150 ease-out hover:bg-[#bd70ff] active:scale-[0.98]"
              href={`/start/consent?mode=${mode.key}`}
            >
              Pilih {mode.name}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

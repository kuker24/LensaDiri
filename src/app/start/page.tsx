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
    <section className="container-shell py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-lens text-sm font-semibold">Mulai eksplorasi</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pilih kedalaman yang nyaman.
        </h1>
        <p className="text-ink-muted mt-5 text-lg leading-8">
          Keduanya memakai item original LensaDiri, scoring server-side deterministik, dan hasil
          private secara default.
        </p>
      </div>
      <ModularLaunchCard />
      <div className="border-line mx-auto mt-8 max-w-4xl border-t pt-8">
        <h2 className="font-display text-xl font-semibold">Tes legacy</h2>
        <p className="text-ink-muted mt-2 text-sm leading-6">
          Quick 40 dan Standard 60 tetap tersedia selama migrasi modular.
        </p>
      </div>
      <div className="mx-auto mt-5 grid max-w-4xl gap-5 md:grid-cols-2">
        {modes.map((mode) => (
          <article
            className="border-line shadow-surface rounded-lg border bg-white p-7"
            key={mode.key}
          >
            <h2 className="font-display text-2xl font-semibold">{mode.name}</h2>
            <p className="text-ink-muted mt-3 leading-7">{mode.description}</p>
            <p className="mt-5 text-sm">
              <strong>{mode.items}</strong> · {mode.duration}
            </p>
            <Link
              className="focus-ring bg-lens text-canvas hover:bg-lens-strong mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-sm px-5 font-semibold transition-colors duration-150 ease-out"
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

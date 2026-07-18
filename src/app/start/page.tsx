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
        <p className="text-sm font-semibold text-lens">Mulai eksplorasi</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pilih kedalaman yang nyaman.
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">
          Keduanya memakai item original LensaDiri, scoring server-side deterministik, dan hasil
          private secara default.
        </p>
      </div>
      <ModularLaunchCard />
      <div className="mx-auto mt-8 max-w-4xl border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold">Tes legacy</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Quick 40 dan Standard 60 tetap tersedia selama migrasi modular.
        </p>
      </div>
      <div className="mx-auto mt-5 grid max-w-4xl gap-5 md:grid-cols-2">
        {modes.map((mode) => (
          <article className="rounded-lg border border-line bg-white p-7 shadow-surface" key={mode.key}>
            <h2 className="font-display text-2xl font-semibold">{mode.name}</h2>
            <p className="mt-3 leading-7 text-ink-muted">{mode.description}</p>
            <p className="mt-5 text-sm">
              <strong>{mode.items}</strong> · {mode.duration}
            </p>
            <Link
              className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-lens px-5 font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-lens-strong"
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

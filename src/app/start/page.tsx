import type { Metadata } from "next";
import Link from "next/link";

import { ModularLaunchCard } from "@/components/modular-launch-card";
import { Reveal } from "@/components/reveal";
import { getButtonClassName } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mulai Eksplorasi",
  robots: { follow: false, index: false },
};

const modes = [
  {
    key: "quick",
    name: "Quick",
    duration: "5–8 menit",
    items: "40 pertanyaan",
    description: "Lima spektrum trait, ringkas.",
  },
  {
    key: "standard",
    name: "Standard",
    duration: "10–15 menit",
    items: "60 pertanyaan",
    description: "Lebih banyak item, confidence lebih kuat.",
  },
] as const;

export default function StartPage() {
  return (
    <section className="task-shell">
      <Reveal className="mx-auto max-w-3xl">
        <p className="mono-label text-ink">Mulai</p>
        <h1 className="mt-5 text-4xl font-normal tracking-[-0.03em] sm:text-5xl">
          Pilih kedalaman yang nyaman.
        </h1>
        <p className="text-ink-muted mt-5 max-w-2xl text-lg leading-8">
          Item original, skor di server, hasil private by default.
        </p>
      </Reveal>

      <Reveal delayMs={80}>
        <ModularLaunchCard />
      </Reveal>

      <Reveal delayMs={120} className="mx-auto mt-12 max-w-4xl border-t border-white/12 pt-8">
        <h2 className="text-xl font-normal">Tes legacy</h2>
        <p className="text-ink-muted mt-2 text-sm leading-6">
          Quick 40 dan Standard 60 tetap tersedia.
        </p>
      </Reveal>

      <Reveal
        delayMs={160}
        className="mx-auto mt-5 grid max-w-4xl border-y border-white/12 md:grid-cols-2"
      >
        {modes.map((mode) => (
          <article
            className="row-hover border-b border-white/12 py-7 md:border-r md:border-b-0 md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
            key={mode.key}
          >
            <h2 className="text-2xl font-normal">{mode.name}</h2>
            <p className="text-ink-muted mt-3 leading-7">{mode.description}</p>
            <p className="mt-5 text-sm">
              <strong>{mode.items}</strong> · {mode.duration}
            </p>
            <Link
              className={`${getButtonClassName("primary", "md")} mt-6 w-full`}
              href={`/start/consent?mode=${mode.key}`}
            >
              Pilih {mode.name}
            </Link>
          </article>
        ))}
      </Reveal>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { ModularLaunchCard } from "@/components/modular-launch-card";
import { BlurFade } from "@/components/ui/blur-fade";
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
      <BlurFade className="mx-auto max-w-3xl">
        <p className="mono-label text-ink">Mulai</p>
        <h1 className="mt-5 text-4xl font-normal tracking-[-0.03em] sm:text-5xl">
          Satu jalur disarankan.
        </h1>
        <p className="text-ink-muted mt-5 max-w-2xl text-lg leading-8">
          Susun lensa modular dulu. Skor di server, hasil privat sampai kamu bagikan.
        </p>
      </BlurFade>

      <BlurFade delay={0.08}>
        <ModularLaunchCard />
      </BlurFade>

      <BlurFade delay={0.12} className="mx-auto mt-12 max-w-4xl">
        <details className="group border-line border-y py-4">
          <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-normal [&::-webkit-details-marker]:hidden">
            <span>Butuh tes lama? Quick 40 / Standard 60</span>
            <span aria-hidden="true" className="text-ink-muted font-mono text-lg">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <p className="text-ink-muted mt-3 text-sm leading-6">
            Jalur legacy tetap tersedia untuk kompatibilitas. Disarankan hanya jika kamu sudah
            terbiasa dengannya.
          </p>
          <div className="mt-5 grid border-y border-white/12 md:grid-cols-2">
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
                  className={`${getButtonClassName("secondary", "md")} mt-6 w-full`}
                  href={`/start/consent?mode=${mode.key}`}
                >
                  Pilih {mode.name}
                </Link>
              </article>
            ))}
          </div>
        </details>
      </BlurFade>
    </section>
  );
}

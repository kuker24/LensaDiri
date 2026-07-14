import type { Metadata } from "next";
import Link from "next/link";

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
        <p className="text-sm font-semibold text-violet-700">Mulai eksplorasi</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pilih kedalaman yang nyaman.
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
          Keduanya memakai item original LensaDiri, scoring server-side deterministik, dan hasil
          private secara default.
        </p>
      </div>
      <div className="mx-auto mt-10 max-w-4xl rounded-3xl bg-[var(--foreground)] p-7 text-white shadow-[var(--shadow)] sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
        <div>
          <p className="text-sm font-semibold text-[var(--aqua)]">PRD v2 · banyak lensa</p>
          <h2 className="mt-2 text-2xl font-semibold">
            Pilih Trait, 16-Type, Enneagram, atau Temperament.
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-indigo-100">
            Kombinasikan lensa, lihat estimasi dinamis, dan dapatkan hasil per module dengan
            correlation read-only.
          </p>
        </div>
        <Link
          className="focus-ring mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-white px-5 font-semibold text-[var(--foreground)] sm:mt-0 sm:w-auto"
          href="/start/modules"
        >
          Pilih lensa modular
        </Link>
      </div>
      <div className="mx-auto mt-8 max-w-4xl border-t border-[var(--line)] pt-8">
        <h2 className="text-xl font-semibold">Tes legacy</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Quick 40 dan Standard 60 tetap tersedia selama migrasi modular.
        </p>
      </div>
      <div className="mx-auto mt-5 grid max-w-4xl gap-5 md:grid-cols-2">
        {modes.map((mode) => (
          <article
            className="rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[var(--shadow)]"
            key={mode.key}
          >
            <h2 className="text-2xl font-semibold">{mode.name}</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">{mode.description}</p>
            <p className="mt-5 text-sm">
              <strong>{mode.items}</strong> · {mode.duration}
            </p>
            <Link
              className="focus-ring mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--foreground)] px-5 font-semibold text-white hover:bg-violet-700"
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

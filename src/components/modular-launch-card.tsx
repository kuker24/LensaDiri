import Link from "next/link";

import { getButtonClassName } from "@/components/ui/button";

export function ModularLaunchCard() {
  return (
    <div className="lens-glow bg-surface text-ink relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-lg border border-white/14 p-7 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
      <div>
        <p className="mono-label text-aperture">Banyak lensa / satu susunan</p>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em]">
          Pilih Trait, 16-Type, Enneagram, atau Temperament.
        </h2>
        <p className="text-ink-muted mt-3 max-w-2xl leading-7">
          Gabungkan lensa, lihat perkiraan durasi, lalu baca hasil setiap lensa beserta hubungannya
          tanpa mengubah skor.
        </p>
      </div>
      <Link
        className={`${getButtonClassName("primary", "md")} mt-6 w-full shrink-0 sm:mt-0 sm:w-auto`}
        href="/start/modules"
      >
        Pilih lensa modular
      </Link>
    </div>
  );
}

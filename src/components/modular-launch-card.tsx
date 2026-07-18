import Link from "next/link";

export function ModularLaunchCard() {
  return (
    <div className="lens-glow relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-lg bg-lens-strong p-7 text-canvas shadow-surface sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
      <div>
        <p className="text-sm font-semibold text-aperture">PRD v2 · banyak lensa</p>
        <h2 className="font-display mt-2 text-2xl font-semibold">
          Pilih Trait, 16-Type, Enneagram, atau Temperament.
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-canvas/85">
          Kombinasikan lensa, lihat estimasi dinamis, dan dapatkan hasil per module dengan
          correlation read-only.
        </p>
      </div>
      <Link
        className="focus-ring mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-sm bg-canvas px-5 font-semibold text-lens-strong transition-colors duration-150 ease-out hover:bg-white sm:mt-0 sm:w-auto"
        href="/start/modules"
      >
        Pilih lensa modular
      </Link>
    </div>
  );
}

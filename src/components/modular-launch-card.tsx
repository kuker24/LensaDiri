import Link from "next/link";

export function ModularLaunchCard() {
  return (
    <div className="lens-glow bg-lens-strong text-canvas shadow-surface relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-xl p-7 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
      <div>
        <p className="text-aperture-on-dark text-sm font-semibold">PRD v2 · banyak lensa</p>
        <h2 className="font-display mt-2 text-2xl font-semibold">
          Pilih Trait, 16-Type, Enneagram, atau Temperament.
        </h2>
        <p className="text-canvas/85 mt-3 max-w-2xl leading-7">
          Kombinasikan lensa, lihat estimasi dinamis, dan dapatkan hasil per module dengan
          correlation read-only.
        </p>
      </div>
      <Link
        className="focus-ring bg-canvas text-lens-strong mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-sm px-5 font-semibold transition-colors duration-150 ease-out hover:bg-white sm:mt-0 sm:w-auto"
        href="/start/modules"
      >
        Pilih lensa modular
      </Link>
    </div>
  );
}

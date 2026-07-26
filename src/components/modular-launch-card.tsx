import Link from "next/link";

export function ModularLaunchCard() {
  return (
    <div className="lens-glow bg-surface text-ink relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-[1.2rem] border border-white/14 p-7 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
      <div>
        <p className="mono-label text-aperture">Banyak lensa / satu blueprint</p>
        <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em]">
          Pilih Trait, 16-Type, Enneagram, atau Temperament.
        </h2>
        <p className="text-ink-muted mt-3 max-w-2xl leading-7">
          Kombinasikan lensa, lihat estimasi dinamis, dan dapatkan hasil per module dengan
          correlation read-only.
        </p>
      </div>
      <Link
        className="focus-ring pressable bg-lens text-canvas mt-6 inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-md px-5 font-semibold transition-[background-color,transform] duration-150 ease-out hover:bg-[#bd70ff] active:scale-[0.98] sm:mt-0 sm:w-auto"
        href="/start/modules"
      >
        Pilih lensa modular
      </Link>
    </div>
  );
}

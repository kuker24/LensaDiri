import Link from "next/link";

export function ModularLaunchCard() {
  return (
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
  );
}

import Link from "next/link";

import { getPublicModeName } from "@/lib/assessment/catalog";
import { listCatalogModules, listComboPresets } from "@/server/repositories/catalog";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const [combos, modules] = await Promise.all([listComboPresets(), listCatalogModules()]);
  const names = new Map(modules.map((module) => [module.key, module.publicName]));

  return (
    <main className="container-shell py-12 sm:py-18">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-violet-700">Preset terkurasi</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Gabungkan lensa tanpa mencampur skor
        </h1>
        <p className="mt-5 leading-7 text-[var(--muted)]">
          Setiap lensa tetap dihitung secara independen. Korelasi baru disusun setelah seluruh skor
          primer final.
        </p>
      </header>

      {combos.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-[var(--line)] bg-white p-6 text-[var(--muted)]">
          Belum ada preset yang memenuhi publication gate.
        </p>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {combos.map((combo) => (
            <li className="rounded-2xl border border-[var(--line)] bg-white p-6" key={combo.key}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-violet-700">
                  {combo.isFullSpectrum ? "Full Spectrum" : "Curated combo"}
                </span>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Rekomendasi {getPublicModeName(combo.recommendedMode)}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold">{combo.publicName}</h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">{combo.description}</p>
              <ul
                className="mt-5 flex flex-wrap gap-2"
                aria-label={`Modul dalam ${combo.publicName}`}
              >
                {combo.moduleKeys.map((key) => (
                  <li
                    className="rounded-full bg-violet-100 px-3 py-1 text-sm text-violet-900"
                    key={key}
                  >
                    {names.get(key) ?? key.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
              <Link
                className="focus-ring mt-6 inline-flex min-h-12 items-center rounded-xl bg-[var(--foreground)] px-5 font-semibold text-white hover:bg-violet-700"
                href="/start/modules"
              >
                Pilih preset
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

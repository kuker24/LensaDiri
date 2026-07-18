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
        <p className="text-lens text-sm font-semibold">Preset terkurasi</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Gabungkan lensa tanpa mencampur skor
        </h1>
        <p className="text-ink-muted mt-5 leading-7">
          Setiap lensa tetap dihitung secara independen. Korelasi baru disusun setelah seluruh skor
          primer final.
        </p>
      </header>

      {combos.length === 0 ? (
        <p className="border-line text-ink-muted mt-10 rounded-md border bg-white/90 p-6">
          Belum ada preset yang memenuhi publication gate.
        </p>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {combos.map((combo) => (
            <li className="border-line rounded-md border bg-white/90 p-6" key={combo.key}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-lens text-sm font-semibold">
                  {combo.isFullSpectrum ? "Full Spectrum" : "Curated combo"}
                </span>
                <span className="text-ink-muted text-xs font-semibold">
                  Rekomendasi {getPublicModeName(combo.recommendedMode)}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold">{combo.publicName}</h2>
              <p className="text-ink-muted mt-3 leading-7">{combo.description}</p>
              <ul
                className="mt-5 flex flex-wrap gap-2"
                aria-label={`Modul dalam ${combo.publicName}`}
              >
                {combo.moduleKeys.map((key) => (
                  <li
                    className="border-lens-soft bg-lens-soft text-lens-strong rounded-md border px-3 py-1 text-sm"
                    key={key}
                  >
                    {names.get(key) ?? key.replaceAll("_", " ")}
                  </li>
                ))}
              </ul>
              <Link
                className="focus-ring bg-lens text-canvas hover:bg-lens-strong mt-6 inline-flex min-h-12 items-center rounded-md px-5 font-semibold transition-colors duration-150 ease-out"
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

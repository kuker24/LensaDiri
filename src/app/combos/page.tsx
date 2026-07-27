import Link from "next/link";

import { getPublicModeName } from "@/lib/assessment/catalog";
import {
  listCatalogModulesFromCache,
  listComboPresetsFromCache,
} from "@/server/repositories/catalog-cache";
import { RecoveryPanel } from "@/components/recovery-panel";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const catalog = await Promise.all([
    listComboPresetsFromCache(),
    listCatalogModulesFromCache(),
  ]).catch(() => null);

  if (!catalog) {
    return (
      <div className="container-shell">
        <RecoveryPanel
          description="Kombinasi lensa sedang tidak tersedia. Coba lagi setelah layanan kembali terhubung."
          reassurance="Tidak ada data pribadi yang diubah."
          reload
          safeHref="/start"
          safeLabel="Pilih jalur lain"
          title="Kombinasi belum dapat dimuat"
        />
      </div>
    );
  }

  const [combos, modules] = catalog;
  const names = new Map(modules.map((module) => [module.key, module.publicName]));

  return (
    <section className="task-shell">
      <header className="max-w-3xl">
        <p className="mono-label text-ink">Kombinasi · preset</p>
        <h1 className="mt-5 text-4xl font-normal tracking-[-0.035em] sm:text-6xl">
          Gabungkan lensa tanpa mencampur skor
        </h1>
        <p className="text-ink-muted mt-5 leading-7">
          Tiap lensa dihitung sendiri. Korelasi disusun setelah skor primer final.
        </p>
      </header>

      {combos.length === 0 ? (
        <p className="border-line bg-surface text-ink-muted mt-10 rounded-lg border p-6">
          Belum ada preset yang memenuhi publication gate.
        </p>
      ) : (
        <ul className="border-line mt-12 border-t">
          {combos.map((combo, index) => (
            <li
              className="border-line grid gap-6 border-b py-8 lg:grid-cols-[3rem_0.8fr_1.2fr_auto] lg:items-start lg:gap-8"
              key={combo.key}
            >
              <span className="text-ink-muted pt-1 font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-aperture font-mono text-[0.65rem] tracking-[0.08em] uppercase">
                    {combo.isFullSpectrum ? "Full Spectrum" : "Curated combo"}
                  </span>
                  <span className="text-ink-muted mt-2 block text-xs font-medium">
                    {combo.status === "experimental"
                      ? "Eksperimental"
                      : combo.status === "pilot"
                        ? "Beta"
                        : "Terkurasi"}{" "}
                    · Rekomendasi {getPublicModeName(combo.recommendedMode)}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-medium tracking-[-0.025em]">{combo.publicName}</h2>
                <p className="text-ink-muted mt-3 leading-7">{combo.description}</p>
                <ul
                  className="mt-5 flex flex-wrap gap-2"
                  aria-label={`Modul dalam ${combo.publicName}`}
                >
                  {combo.moduleKeys.map((key) => (
                    <li
                      className="border-line bg-mist text-ink-muted rounded-md border px-3 py-1 text-sm"
                      key={key}
                    >
                      {names.get(key) ?? key.replaceAll("_", " ")}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                className="focus-ring text-aperture hover:text-ink inline-flex min-h-11 items-center rounded-md font-medium transition-colors"
                href="/start/modules"
              >
                Pilih preset <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import Link from "next/link";

import { isPubliclyAvailableModule } from "@/lib/assessment/catalog";
import { listCatalogModulesFromCache } from "@/server/repositories/catalog-cache";
import { Badge } from "@/components/ui/badge";
import { RecoveryPanel } from "@/components/recovery-panel";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const modules = await listCatalogModulesFromCache({ includeUnavailable: true }).catch(() => null);

  if (!modules) {
    return (
      <div className="container-shell">
        <RecoveryPanel
          description="Katalog lensa sedang tidak tersedia. Coba lagi setelah layanan kembali terhubung."
          reassurance="Tidak ada data pribadi yang diubah."
          reload
          safeHref="/start"
          safeLabel="Pilih jalur lain"
          title="Katalog belum dapat dimuat"
        />
      </div>
    );
  }

  return (
    <section className="container-shell py-16 sm:py-24">
      <header className="max-w-3xl">
        <p className="mono-label text-aperture">Katalog / 10 lensa</p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          Pilih lensa yang relevan
        </h1>
        <p className="text-ink-muted mt-5 leading-7">
          Setiap modul memiliki item dan scoring sendiri. Modul yang belum melewati review tetap
          terlihat sebagai roadmap, tetapi tidak dapat dipilih dan tidak pernah ditebak dari Profil
          Trait.
        </p>
      </header>

      <ul className="border-line mt-12 border-t" aria-label="Daftar modul LensaDiri">
        {modules.map((module, index) => {
          const available = isPubliclyAvailableModule(module);
          return (
            <li
              className="border-line grid gap-5 border-b py-8 lg:grid-cols-[3rem_0.8fr_1.2fr_auto] lg:items-start lg:gap-8"
              key={module.key}
            >
              <span className="text-ink-muted pt-1 font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <Badge tone="lens">Evidence {module.evidenceTier.replace("_", " ")}</Badge>
                <span className="text-ink-muted mt-3 block font-mono text-[0.65rem] tracking-[0.08em] uppercase">
                  {available
                    ? module.status === "experimental"
                      ? "Eksperimental"
                      : module.status === "pilot"
                        ? "Beta"
                        : "Tersedia"
                    : "Belum tersedia"}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-medium tracking-[-0.025em]">{module.publicName}</h2>
                <p className="text-ink-muted mt-3 max-w-2xl leading-7">{module.description}</p>
                {!available && module.availabilityReason ? (
                  <p className="text-warning mt-4 text-sm leading-6">{module.availabilityReason}</p>
                ) : null}
              </div>
              <div>
                {available ? (
                  <Link
                    className="focus-ring text-aperture hover:text-ink inline-flex min-h-11 items-center rounded-md font-medium transition-colors"
                    href={`/modules/${module.key}`}
                  >
                    Lihat detail <span aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  <p className="text-ink-muted py-3 text-sm font-medium">Detail belum tersedia</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicModeName, isPubliclyAvailableModule } from "@/lib/assessment/catalog";
import { getCatalogModuleByKey } from "@/server/repositories/catalog";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ModuleDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const catalogModule = await getCatalogModuleByKey(key);
  if (!catalogModule) notFound();

  const available = isPubliclyAvailableModule(catalogModule);
  const modes = (["quick", "standard", "deep"] as const).map((mode) => ({
    count: catalogModule.modeQuota[mode],
    label: getPublicModeName(mode),
  }));

  return (
    <main className="container-shell py-12 sm:py-18">
      <Link className="focus-ring rounded-md text-sm font-semibold text-lens" href="/modules">
        Kembali ke katalog
      </Link>
      <article className="mt-6 max-w-4xl rounded-lg border border-line bg-white p-7 sm:p-10">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge tone="lens">Evidence {catalogModule.evidenceTier.replace("_", " ")}</Badge>
          <Badge tone="neutral">
            {available ? "Release-ready" : catalogModule.releaseDisposition?.replaceAll("_", " ")}
          </Badge>
        </div>
        <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          {catalogModule.publicName}
        </h1>
        <p className="mt-5 max-w-3xl leading-7 text-ink-muted">{catalogModule.description}</p>

        <section className="mt-8" aria-labelledby="depth-heading">
          <h2 className="font-display text-2xl font-semibold" id="depth-heading">
            Coverage per mode
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {modes.map((mode) => (
              <div className="rounded-md border border-line p-4" key={mode.label}>
                <dt className="font-semibold">{mode.label}</dt>
                <dd className="tabular-nums mt-1 text-sm text-ink-muted">
                  Target alokasi {mode.count} item
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-8 rounded-md border border-line bg-lens-soft/40 p-5" aria-labelledby="boundary-heading">
          <h2 className="font-semibold" id="boundary-heading">
            Batas interpretasi
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Hasil menggambarkan kecenderungan jawaban saat ini. Lensa ini bukan diagnosis, instrumen
            resmi, atau kepastian identitas.
          </p>
        </section>

        {available ? (
          <Link
            className="focus-ring mt-8 inline-flex min-h-12 items-center rounded-sm bg-lens px-5 font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-lens-strong"
            href="/start/modules"
          >
            Pilih modul ini
          </Link>
        ) : (
          <div className="mt-8 rounded-md border border-aperture-soft bg-aperture-soft p-5 text-ink">
            <h2 className="font-semibold">Belum dapat dipilih</h2>
            <p className="mt-2 text-sm leading-6">
              {catalogModule.availabilityReason ?? "Modul masih berada dalam review."}
            </p>
          </div>
        )}
      </article>
    </main>
  );
}

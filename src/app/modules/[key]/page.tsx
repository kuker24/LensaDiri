import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicModeName, isPubliclyAvailableModule } from "@/lib/assessment/catalog";
import { getCatalogModuleByKeyFromCache } from "@/server/repositories/catalog-cache";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ModuleDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const catalogModule = await getCatalogModuleByKeyFromCache(key);
  if (!catalogModule) notFound();

  const available = isPubliclyAvailableModule(catalogModule);
  const modes = (["quick", "standard", "deep"] as const).map((mode) => ({
    count: catalogModule.modeQuota[mode],
    label: getPublicModeName(mode),
  }));

  return (
    <main className="container-shell py-12 sm:py-18">
      <Link className="focus-ring text-lens rounded-md text-sm font-semibold" href="/modules">
        Kembali ke katalog
      </Link>
      <article className="border-line mt-6 max-w-4xl rounded-md border bg-white/90 p-7 sm:p-10">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge tone="lens">Evidence {catalogModule.evidenceTier.replace("_", " ")}</Badge>
          <Badge tone="neutral">
            {available ? "Release-ready" : catalogModule.releaseDisposition?.replaceAll("_", " ")}
          </Badge>
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          {catalogModule.publicName}
        </h1>
        <p className="text-ink-muted mt-5 max-w-3xl leading-7">{catalogModule.description}</p>

        <section className="mt-8" aria-labelledby="depth-heading">
          <h2 className="text-2xl font-semibold" id="depth-heading">
            Coverage per mode
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {modes.map((mode) => (
              <div className="border-line rounded-md border p-4" key={mode.label}>
                <dt className="font-semibold">{mode.label}</dt>
                <dd className="text-ink-muted mt-1 text-sm tabular-nums">
                  Target alokasi {mode.count} item
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="border-line bg-lens-soft/40 mt-8 rounded-md border p-5"
          aria-labelledby="boundary-heading"
        >
          <h2 className="font-semibold" id="boundary-heading">
            Batas interpretasi
          </h2>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            Hasil menggambarkan kecenderungan jawaban saat ini. Lensa ini bukan diagnosis, instrumen
            resmi, atau kepastian identitas.
          </p>
        </section>

        {available ? (
          <Link
            className="focus-ring bg-lens text-canvas hover:bg-lens-strong mt-8 inline-flex min-h-12 items-center rounded-md px-5 font-semibold transition-colors duration-150 ease-out"
            href={`/start/modules?module=${encodeURIComponent(catalogModule.key)}`}
          >
            Pilih modul ini
          </Link>
        ) : (
          <div className="border-aperture/50 bg-aperture-soft/70 text-ink mt-8 rounded-md border p-5">
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

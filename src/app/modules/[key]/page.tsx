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
    <section className="container-shell py-16 sm:py-24">
      <Link
        className="focus-ring text-ink-muted hover:text-ink inline-flex min-h-11 items-center rounded-md text-sm transition-colors"
        href="/modules"
      >
        ← Kembali ke katalog
      </Link>
      <article className="mt-8 max-w-4xl">
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge tone="lens">Evidence {catalogModule.evidenceTier.replace("_", " ")}</Badge>
          <Badge
            tone={
              catalogModule.status === "experimental"
                ? "warning"
                : catalogModule.status === "pilot"
                  ? "aperture"
                  : "neutral"
            }
          >
            {available
              ? catalogModule.status === "experimental"
                ? "Eksperimental"
                : catalogModule.status === "pilot"
                  ? "Beta terbatas"
                  : "Release-ready"
              : catalogModule.releaseDisposition?.replaceAll("_", " ")}
          </Badge>
          <Badge tone="neutral">Usia minimum {catalogModule.minimumAge}</Badge>
        </div>
        <h1 className="mt-6 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          {catalogModule.publicName}
        </h1>
        <p className="text-ink-muted mt-5 max-w-3xl leading-7">{catalogModule.description}</p>

        <section className="mt-8" aria-labelledby="depth-heading">
          <h2 className="text-2xl font-semibold" id="depth-heading">
            Coverage per mode
          </h2>
          <dl className="border-line mt-5 grid border-y sm:grid-cols-3">
            {modes.map((mode) => (
              <div
                className="border-line py-5 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0"
                key={mode.label}
              >
                <dt className="font-semibold">{mode.label}</dt>
                <dd className="text-ink-muted mt-1 text-sm tabular-nums">
                  Target alokasi {mode.count} item
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          className="border-lens/25 bg-lens-soft mt-10 rounded-lg border p-6"
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
            className="focus-ring pressable bg-lens text-canvas mt-8 inline-flex min-h-12 items-center rounded-md px-5 font-semibold transition-[background-color,transform] duration-150 ease-out hover:bg-[#bd70ff] active:scale-[0.98]"
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
    </section>
  );
}

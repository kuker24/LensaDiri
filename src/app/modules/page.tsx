import Link from "next/link";

import { isPubliclyAvailableModule } from "@/lib/assessment/catalog";
import { listCatalogModules } from "@/server/repositories/catalog";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const modules = await listCatalogModules({ includeUnavailable: true });

  return (
    <main className="container-shell py-12 sm:py-18">
      <header className="max-w-3xl">
        <p className="text-lens text-sm font-semibold">Katalog lensa</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Pilih lensa yang relevan
        </h1>
        <p className="text-ink-muted mt-5 leading-7">
          Setiap modul memiliki item dan scoring sendiri. Modul yang belum melewati review tetap
          terlihat sebagai roadmap, tetapi tidak dapat dipilih dan tidak pernah ditebak dari Profil
          Trait.
        </p>
      </header>

      <ul className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Daftar modul LensaDiri">
        {modules.map((module) => {
          const available = isPubliclyAvailableModule(module);
          return (
            <li className="border-line rounded-md border bg-white/90 p-6" key={module.key}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="lens">Evidence {module.evidenceTier.replace("_", " ")}</Badge>
                <span className="text-ink-muted text-xs font-semibold">
                  {available ? "Tersedia" : "Belum tersedia"}
                </span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold">{module.publicName}</h2>
              <p className="text-ink-muted mt-3 leading-7">{module.description}</p>
              {!available && module.availabilityReason ? (
                <p className="border-aperture/50 bg-aperture-soft/70 text-ink mt-4 rounded-md border p-4 text-sm leading-6">
                  {module.availabilityReason}
                </p>
              ) : null}
              {available ? (
                <Link
                  className="focus-ring border-line text-ink hover:border-lens hover:text-lens mt-5 inline-flex min-h-11 items-center rounded-md border px-4 font-semibold transition-colors duration-150 ease-out"
                  href={`/modules/${module.key}`}
                >
                  Lihat detail
                </Link>
              ) : (
                <p className="text-ink-muted mt-5 text-sm font-semibold">Detail belum tersedia</p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

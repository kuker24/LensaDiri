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
        <p className="text-sm font-semibold text-lens">Katalog lensa</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pilih lensa yang relevan
        </h1>
        <p className="mt-5 leading-7 text-ink-muted">
          Setiap modul memiliki item dan scoring sendiri. Modul yang belum melewati review tetap
          terlihat sebagai roadmap, tetapi tidak dapat dipilih dan tidak pernah ditebak dari Profil
          Trait.
        </p>
      </header>

      <ul className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Daftar modul LensaDiri">
        {modules.map((module) => {
          const available = isPubliclyAvailableModule(module);
          return (
            <li className="rounded-lg border border-line bg-white p-6" key={module.key}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone="lens">Evidence {module.evidenceTier.replace("_", " ")}</Badge>
                <span className="text-xs font-semibold text-ink-muted">
                  {available ? "Tersedia" : "Belum tersedia"}
                </span>
              </div>
              <h2 className="font-display mt-5 text-2xl font-semibold">{module.publicName}</h2>
              <p className="mt-3 leading-7 text-ink-muted">{module.description}</p>
              {!available && module.availabilityReason ? (
                <p className="mt-4 rounded-md border border-aperture-soft bg-aperture-soft p-4 text-sm leading-6 text-ink">
                  {module.availabilityReason}
                </p>
              ) : null}
              <Link
                className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-sm border border-line px-4 font-semibold text-ink transition-colors duration-150 ease-out hover:border-lens hover:text-lens"
                href={`/modules/${module.key}`}
              >
                Lihat detail
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

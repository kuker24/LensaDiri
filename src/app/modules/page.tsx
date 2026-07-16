import Link from "next/link";

import { isPubliclyAvailableModule } from "@/lib/assessment/catalog";
import { listCatalogModules } from "@/server/repositories/catalog";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const modules = await listCatalogModules({ includeUnavailable: true });

  return (
    <main className="container-shell py-12 sm:py-18">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-violet-700">Katalog lensa</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pilih lensa yang relevan
        </h1>
        <p className="mt-5 leading-7 text-[var(--muted)]">
          Setiap modul memiliki item dan scoring sendiri. Modul yang belum melewati review tetap
          terlihat sebagai roadmap, tetapi tidak dapat dipilih dan tidak pernah ditebak dari Profil
          Trait.
        </p>
      </header>

      <ul className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Daftar modul LensaDiri">
        {modules.map((module) => {
          const available = isPubliclyAvailableModule(module);
          return (
            <li className="rounded-2xl border border-[var(--line)] bg-white p-6" key={module.key}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900">
                  Evidence {module.evidenceTier.replace("_", " ")}
                </span>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  {available ? "Tersedia" : "Belum tersedia"}
                </span>
              </div>
              <h2 className="mt-5 text-2xl font-semibold">{module.publicName}</h2>
              <p className="mt-3 leading-7 text-[var(--muted)]">{module.description}</p>
              {!available && module.availabilityReason ? (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  {module.availabilityReason}
                </p>
              ) : null}
              <Link
                className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-xl border border-[var(--line)] px-4 font-semibold hover:border-violet-300 hover:text-violet-700"
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

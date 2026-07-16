import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicModeName, isPubliclyAvailableModule } from "@/lib/assessment/catalog";
import { getCatalogModuleByKey } from "@/server/repositories/catalog";

export const dynamic = "force-dynamic";

export default async function ModuleDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const module = await getCatalogModuleByKey(key);
  if (!module) notFound();

  const available = isPubliclyAvailableModule(module);
  const modes = (["quick", "standard", "deep"] as const).map((mode) => ({
    count: module.modeQuota[mode],
    label: getPublicModeName(mode),
  }));

  return (
    <main className="container-shell py-12 sm:py-18">
      <Link className="focus-ring rounded-md text-sm font-semibold text-violet-700" href="/modules">
        Kembali ke katalog
      </Link>
      <article className="mt-6 max-w-4xl rounded-3xl border border-[var(--line)] bg-white p-7 sm:p-10">
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-900">
            Evidence {module.evidenceTier.replace("_", " ")}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-800">
            {available ? "Release-ready" : module.releaseDisposition?.replaceAll("_", " ")}
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{module.publicName}</h1>
        <p className="mt-5 max-w-3xl leading-7 text-[var(--muted)]">{module.description}</p>

        <section className="mt-8" aria-labelledby="depth-heading">
          <h2 className="text-2xl font-semibold" id="depth-heading">Coverage per mode</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {modes.map((mode) => (
              <div className="rounded-xl border border-[var(--line)] p-4" key={mode.label}>
                <dt className="font-semibold">{mode.label}</dt>
                <dd className="mt-1 text-sm text-[var(--muted)]">Target alokasi {mode.count} item</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-8 rounded-2xl bg-violet-50 p-5" aria-labelledby="boundary-heading">
          <h2 className="font-semibold" id="boundary-heading">Batas interpretasi</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Hasil menggambarkan kecenderungan jawaban saat ini. Lensa ini bukan diagnosis, instrumen resmi,
            atau kepastian identitas.
          </p>
        </section>

        {available ? (
          <Link
            className="focus-ring mt-8 inline-flex min-h-12 items-center rounded-xl bg-[var(--foreground)] px-5 font-semibold text-white hover:bg-violet-700"
            href="/start/modules"
          >
            Pilih modul ini
          </Link>
        ) : (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <h2 className="font-semibold">Belum dapat dipilih</h2>
            <p className="mt-2 text-sm leading-6">{module.availabilityReason ?? "Modul masih berada dalam review."}</p>
          </div>
        )}
      </article>
    </main>
  );
}

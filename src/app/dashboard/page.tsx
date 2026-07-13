import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { getCurrentSession } from "@/server/current-session";
import { listAccountResultSummaries } from "@/server/repositories/assessment";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const results = session ? await listAccountResultSummaries(session.accountId) : [];
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-700">Dashboard pribadi</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Selamat datang kembali.
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
            Assessment akan hadir pada fase berikutnya. Kontrol akun dan fondasi privasi sudah
            aktif.
          </p>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-10" aria-labelledby="saved-results-heading">
        <h2 className="text-2xl font-semibold" id="saved-results-heading">
          Hasil tersimpan
        </h2>
        {results.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-6 text-[var(--muted)]">
            Belum ada hasil akun. Assessment berikutnya akan tersimpan otomatis saat kamu masuk.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {results.map((result) => (
              <li
                className="rounded-2xl border border-[var(--line)] bg-white p-5"
                key={`${result.createdAt}-${result.archetype}`}
              >
                <p className="font-semibold">{result.archetype}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                    new Date(result.createdAt),
                  )}{" "}
                  · {result.scoringVersion}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 flex flex-wrap gap-5">
        <section className="min-w-[min(100%,20rem)] flex-1 rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold">Eksplorasi</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            Pilih Quick atau Standard saat runner assessment aktif.
          </p>
          <Link
            className="focus-ring mt-5 inline-flex rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white transition hover:bg-violet-700"
            href="/start"
          >
            Lihat mode
          </Link>
        </section>

        <section className="min-w-[min(100%,20rem)] flex-1 rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold">Privasi akun</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            Periksa kontrol data dan hapus akun secara permanen.
          </p>
          <Link
            className="focus-ring mt-5 inline-flex rounded-xl border border-[var(--line)] px-5 py-3 font-semibold transition hover:border-violet-300 hover:text-violet-700"
            href="/dashboard/privacy"
          >
            Buka pusat privasi
          </Link>
        </section>
      </div>
    </section>
  );
}

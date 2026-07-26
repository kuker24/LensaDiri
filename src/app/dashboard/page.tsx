import Link from "next/link";

import { DashboardOpenButton } from "@/components/dashboard-open-button";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentSession } from "@/server/current-session";
import {
  listAccountActiveSessions,
  listAccountDashboardResults,
} from "@/server/repositories/dashboard";

function formatModuleKey(key: string): string {
  return key.replaceAll("_", " ");
}

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const [activeSessions, results] = session
    ? await Promise.all([
        listAccountActiveSessions(session.accountId),
        listAccountDashboardResults(session.accountId),
      ])
    : [[], []];

  return (
    <main className="container-shell py-12 sm:py-16">
      <header className="flex flex-col gap-6 border-b border-white/12 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono-label text-aperture">Dashboard pribadi</p>
          <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
            Sesi, hasil, dan kontrol datamu
          </h1>
          <p className="text-steel mt-3 max-w-2xl leading-7">
            Lanjutkan assessment yang belum selesai atau buka hasil untuk membagikan, mencabut
            share, mengekspor, memberi feedback, dan menghapus data.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-10" aria-labelledby="active-sessions-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-normal" id="active-sessions-heading">
              Sesi aktif
            </h2>
            <p className="text-steel mt-1 text-sm">
              Token sesi dirotasi saat kamu menekan lanjutkan.
            </p>
          </div>
          <Link
            className="focus-ring bg-lens text-canvas hover:bg-lens-strong inline-flex min-h-11 items-center rounded-md px-4 py-3 text-sm transition-colors duration-150 ease-out"
            href="/start/modules"
          >
            Mulai assessment
          </Link>
        </div>
        {activeSessions.length === 0 ? (
          <p className="text-steel bg-surface mt-4 rounded-[1.2rem] border border-white/12 p-6">
            Tidak ada sesi aktif.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/12 border-y border-white/12">
            {activeSessions.map((item) => (
              <li className="bg-surface/40 py-5 first:pt-5" key={item.id}>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-normal capitalize">
                      {item.moduleKeys.map(formatModuleKey).join(" · ")}
                    </p>
                    <p className="text-steel mt-1 text-sm tabular-nums">
                      {item.answeredCount}/{item.totalCount} terjawab · Bagian{" "}
                      {item.currentSegmentIndex}/{item.segmentCount} · {item.status}
                    </p>
                    <div
                      aria-label={`${item.answeredCount} dari ${item.totalCount} pertanyaan terjawab`}
                      className="bg-line mt-3 h-1.5 max-w-xl overflow-hidden rounded-full"
                      role="img"
                    >
                      <div
                        className="bg-lens h-full rounded-full"
                        style={{
                          width: `${Math.round((item.answeredCount / item.totalCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <DashboardOpenButton id={item.id} kind="session" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="saved-results-heading">
        <h2 className="text-2xl font-normal" id="saved-results-heading">
          Riwayat hasil
        </h2>
        {results.length === 0 ? (
          <p className="text-steel bg-surface mt-4 rounded-[1.2rem] border border-white/12 p-6">
            Belum ada hasil tersimpan.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-white/12 border-y border-white/12">
            {results.map((result) => (
              <li className="bg-surface/40 py-5" key={result.id}>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-normal capitalize">
                      {result.moduleKeys.map(formatModuleKey).join(" · ")}
                    </p>
                    <p className="text-steel mt-1 text-sm">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                        new Date(result.createdAt),
                      )}{" "}
                      · {result.scoringVersion}
                    </p>
                    <p className="text-steel mt-1 text-sm tabular-nums">
                      {result.activeShareCount} share aktif
                    </p>
                  </div>
                  <DashboardOpenButton id={result.id} kind="result" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="mt-12 grid gap-px overflow-hidden rounded-[1.2rem] border border-white/12 bg-white/12 md:grid-cols-2"
        aria-label="Kontrol akun"
      >
        <article className="bg-surface p-6">
          <h2 className="text-xl font-normal">Privasi dan consent</h2>
          <p className="text-steel mt-3 leading-7">
            Periksa consent opsional, kebijakan retensi, export, dan penghapusan data.
          </p>
          <Link
            className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-md border border-white/20 px-5 py-3 text-sm transition-colors duration-150 ease-out hover:bg-white/5"
            href="/dashboard/privacy"
          >
            Buka pusat privasi
          </Link>
        </article>
        <article className="bg-surface p-6">
          <h2 className="text-xl font-normal">Hapus akun</h2>
          <p className="text-steel mt-3 leading-7">
            Hard-delete menghapus sesi, jawaban, hasil modular, share, feedback, dan data akun
            terkait.
          </p>
          <Link
            className="focus-ring border-danger-soft text-danger hover:bg-danger-soft mt-5 inline-flex min-h-11 items-center rounded-md border px-5 py-3 text-sm transition-colors duration-150 ease-out"
            href="/dashboard/privacy#delete-account-title"
          >
            Kelola penghapusan akun
          </Link>
        </article>
      </section>
    </main>
  );
}

import Link from "next/link";

import { DashboardOpenButton } from "@/components/dashboard-open-button";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentSession } from "@/server/current-session";
import { listAccountActiveSessions, listAccountDashboardResults } from "@/server/repositories/dashboard";

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
    <main className="container-shell py-12 sm:py-18">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-700">Dashboard pribadi</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Sesi, hasil, dan kontrol datamu</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[var(--muted)]">
            Lanjutkan assessment yang belum selesai atau buka hasil untuk membagikan, mencabut share,
            mengekspor, memberi feedback, dan menghapus data.
          </p>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-10" aria-labelledby="active-sessions-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold" id="active-sessions-heading">Sesi aktif</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Token sesi dirotasi saat kamu menekan lanjutkan.</p>
          </div>
          <Link className="focus-ring rounded-xl bg-[var(--foreground)] px-4 py-3 font-semibold text-white" href="/start/modules">
            Mulai assessment
          </Link>
        </div>
        {activeSessions.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-6 text-[var(--muted)]">
            Tidak ada sesi aktif.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {activeSessions.map((item) => (
              <li className="rounded-2xl border border-[var(--line)] bg-white p-5" key={item.id}>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold capitalize">{item.moduleKeys.map(formatModuleKey).join(" · ")}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {item.answeredCount}/{item.totalCount} terjawab · Bagian {item.currentSegmentIndex}/{item.segmentCount} · {item.status}
                    </p>
                    <div className="mt-3 h-2 max-w-xl overflow-hidden rounded-full bg-violet-100" role="img" aria-label={`${item.answeredCount} dari ${item.totalCount} pertanyaan terjawab`}>
                      <div className="h-full bg-violet-700" style={{ width: `${Math.round((item.answeredCount / item.totalCount) * 100)}%` }} />
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
        <h2 className="text-2xl font-semibold" id="saved-results-heading">Riwayat hasil</h2>
        {results.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-6 text-[var(--muted)]">Belum ada hasil tersimpan.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {results.map((result) => (
              <li className="rounded-2xl border border-[var(--line)] bg-white p-5" key={result.id}>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold capitalize">{result.moduleKeys.map(formatModuleKey).join(" · ")}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(result.createdAt))} · {result.scoringVersion}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{result.activeShareCount} share aktif</p>
                  </div>
                  <DashboardOpenButton id={result.id} kind="result" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-2" aria-label="Kontrol akun">
        <article className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold">Privasi dan consent</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">Periksa consent opsional, kebijakan retensi, export, dan penghapusan data.</p>
          <Link className="focus-ring mt-5 inline-flex rounded-xl border border-[var(--line)] px-5 py-3 font-semibold" href="/dashboard/privacy">Buka pusat privasi</Link>
        </article>
        <article className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold">Hapus akun</h2>
          <p className="mt-3 leading-7 text-[var(--muted)]">Hard-delete menghapus sesi, jawaban, hasil modular, share, feedback, dan data akun terkait.</p>
          <Link className="focus-ring mt-5 inline-flex rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-800" href="/dashboard/delete-account">Kelola penghapusan akun</Link>
        </article>
      </section>
    </main>
  );
}

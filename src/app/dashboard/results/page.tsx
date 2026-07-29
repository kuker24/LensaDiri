import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardOpenButton } from "@/components/dashboard-open-button";
import { getCurrentSession } from "@/server/current-session";
import { listAccountDashboardResults } from "@/server/repositories/dashboard";
import { Button } from "@/components/ui/button";

export default async function DashboardResultsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const results = await listAccountDashboardResults(session.accountId);

  return (
    <div className="task-shell">
      <nav
        aria-label="Jejak navigasi"
        className="text-ink-muted mb-6 font-mono text-xs tracking-[-0.02em]"
      >
        <Link className="focus-ring quiet-link rounded-[12px]" href="/dashboard" prefetch={false}>
          Ruang pribadi
        </Link>
        <span className="mx-2">/</span>
        <span>Semua hasil</span>
      </nav>

      <h1 className="text-3xl font-normal tracking-[-0.03em]">Hasil asesmen</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">Riwayat laporan yang sudah selesai.</p>

      {results.length === 0 ? (
        <div className="border-line bg-surface rounded-[16px] border p-8 text-center">
          <p className="text-ink-muted text-lg">Belum ada hasil tersimpan.</p>
          <Link className="mt-4 inline-block" href="/start">
            <Button>Mulai tes</Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-white/12 border-y border-white/12">
          {results.map((res) => (
            <li className="row-hover bg-surface/40 py-5" key={res.id}>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-normal capitalize">{res.moduleKeys.join(" · ")}</p>
                  <p className="text-ink-muted mt-1 text-sm">
                    {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                      new Date(res.createdAt),
                    )}{" "}
                    · Versi {res.scoringVersion}
                  </p>
                </div>
                <DashboardOpenButton id={res.id} kind="result" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

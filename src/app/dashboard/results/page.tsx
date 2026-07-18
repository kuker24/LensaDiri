import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentSession } from "@/server/current-session";
import { listAccountDashboardResults } from "@/server/repositories/dashboard";
import { Button } from "@/components/ui/button";

export default async function DashboardResultsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const results = await listAccountDashboardResults(session.accountId);

  return (
    <main className="container-shell py-12">
      <nav aria-label="Breadcrumb" className="text-ink-muted mb-6 text-sm">
        <Link className="hover:text-ink underline" href="/dashboard">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span>Semua hasil</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold">Hasil asesmen</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Riwayat dan laporan lengkap kepribadian yang sudah diselesaikan.
      </p>

      {results.length === 0 ? (
        <div className="border-line rounded-lg border bg-white/90 p-8 text-center">
          <p className="text-ink-muted text-lg">Belum ada hasil tersimpan.</p>
          <Link className="mt-4 inline-block" href="/start">
            <Button>Mulai tes</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {results.map((res) => (
            <li
              className="border-line flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white/90 p-5"
              key={res.id}
            >
              <div>
                <p className="font-semibold">
                  Modul: {res.moduleKeys.join(", ").replaceAll("_", " ")}
                </p>
                <p className="text-ink-muted text-sm">
                  Dibuat pada: {new Date(res.createdAt).toLocaleDateString("id-ID")}
                </p>
                <p className="text-ink-muted text-xs">
                  Scoring Version: {res.scoringVersion} · Share token aktif: {res.activeShareCount}
                </p>
              </div>
              <Link href={`/result/${res.id}`}>
                <Button>Buka Hasil</Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

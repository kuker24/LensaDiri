import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentSession } from "@/server/current-session";
import { listAccountActiveSessions } from "@/server/repositories/dashboard";
import { Button } from "@/components/ui/button";

export default async function DashboardSessionsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const sessions = await listAccountActiveSessions(session.accountId);

  return (
    <main className="container-shell py-12">
      <nav aria-label="Breadcrumb" className="text-ink-muted mb-6 text-sm">
        <Link className="hover:text-ink underline" href="/dashboard">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span>Sesi aktif</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold">Sesi aktif</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Sesi yang masih berjalan dan dapat dilanjutkan.
      </p>

      {sessions.length === 0 ? (
        <div className="border-line rounded-lg border bg-white/90 p-8 text-center">
          <p className="text-ink-muted text-lg">Tidak ada sesi aktif.</p>
          <Link className="mt-4 inline-block" href="/start">
            <Button>Mulai eksplorasi</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {sessions.map((active) => (
            <li
              className="border-line flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white/90 p-5"
              key={active.id}
            >
              <div>
                <p className="font-semibold capitalize">
                  {active.selectionType.replaceAll("_", " ")} · {active.mode}
                </p>
                <p className="text-ink-muted text-sm">
                  {active.moduleKeys.join(", ")} · {active.answeredCount} / {active.totalCount}{" "}
                  terjawab
                </p>
                <p className="text-ink-muted text-xs">
                  Segmen {active.currentSegmentIndex} dari {active.segmentCount}
                </p>
              </div>
              <Link href={`/test/${active.id}`}>
                <Button>Lanjutkan</Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

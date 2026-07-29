import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardOpenButton } from "@/components/dashboard-open-button";
import { getCurrentSession } from "@/server/current-session";
import { listAccountActiveSessions } from "@/server/repositories/dashboard";
import { getButtonClassName } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const moduleLabels: Record<string, string> = {
  attachment: "Refleksi Attachment",
  enneagram: "Lensa Motivasi",
  instinct: "Varian Instingtual",
  psychosophy: "Psychosophy",
  riasec: "Minat Karier RIASEC",
  socionics_communication: "Komunikasi Socionics",
  temperament: "Temperamen",
  three_center: "Pola Tiga Pusat",
  trait_profile: "Profil Trait",
  type_16: "16-Type",
};

const sessionStatusLabels: Record<string, string> = {
  active: "Berjalan",
  paused: "Dijeda",
};

function formatModuleKey(key: string): string {
  return moduleLabels[key] ?? "Lensa reflektif";
}

export default async function DashboardSessionsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const sessions = await listAccountActiveSessions(session.accountId);

  return (
    <div className="task-shell">
      <nav
        aria-label="Jejak navigasi"
        className="text-ink-muted mb-6 font-mono text-xs tracking-[-0.02em]"
      >
        <Link className="focus-ring quiet-link rounded-[12px]" href="/dashboard" prefetch={false}>
          Ruang pribadi
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>Sesi aktif</span>
      </nav>

      <h1 className="text-3xl font-normal tracking-[-0.03em]">Sesi aktif</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Sesi yang masih berjalan dan dapat dilanjutkan.
      </p>

      {sessions.length === 0 ? (
        <div className="border-line bg-surface rounded-[16px] border p-8 text-center">
          <p className="text-ink text-lg font-normal">Belum ada sesi aktif.</p>
          <p className="text-ink-muted mx-auto mt-2 max-w-md leading-7">
            Mulai dari satu lensa — kamu bisa menjeda kapan saja.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className={getButtonClassName("primary", "md")}
              href="/start/modules"
              prefetch={false}
            >
              Mulai asesmen
            </Link>
            <Link className={getButtonClassName("secondary", "md")} href="/method">
              Pelajari metode
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-white/12 border-y border-white/12">
          {sessions.map((active) => (
            <li className="row-hover bg-surface/40 py-5" key={active.id}>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-normal capitalize">
                    {active.moduleKeys.map(formatModuleKey).join(" · ")}
                  </p>
                  <p className="text-ink-muted mt-1 text-sm tabular-nums">
                    {active.answeredCount}/{active.totalCount} · Bagian {active.currentSegmentIndex}
                    /{active.segmentCount} · {sessionStatusLabels[active.status] ?? "Berjalan"}
                  </p>
                  <Progress
                    aria-label={`${active.answeredCount} dari ${active.totalCount} pertanyaan terjawab`}
                    className="mt-3 max-w-xl"
                    max={active.totalCount}
                    value={active.answeredCount}
                  />
                </div>
                <DashboardOpenButton id={active.id} kind="session" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

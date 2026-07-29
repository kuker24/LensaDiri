import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardOpenButton } from "@/components/dashboard-open-button";
import { getCurrentSession } from "@/server/current-session";
import { listAccountDashboardResults } from "@/server/repositories/dashboard";
import { getButtonClassName } from "@/components/ui/button";

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

export default async function DashboardResultsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?redirectTo=%2Fdashboard%2Fresults");

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
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>Semua hasil</span>
      </nav>

      <h1 className="text-3xl font-normal tracking-[-0.03em]">Hasil asesmen</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">Riwayat laporan yang sudah selesai.</p>

      {results.length === 0 ? (
        <div className="border-line bg-surface rounded-[16px] border p-8 text-center">
          <p className="text-ink-muted text-lg">Belum ada hasil tersimpan.</p>
          <Link className={`${getButtonClassName("primary", "md")} mt-4`} href="/start">
            Mulai asesmen
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-white/12 border-y border-white/12">
          {results.map((res) => (
            <li className="row-hover bg-surface/40 py-5" key={res.id}>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-normal">
                    {res.moduleKeys
                      .map((key) => moduleLabels[key] ?? "Lensa reflektif")
                      .join(" · ")}
                  </p>
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

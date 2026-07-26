import Link from "next/link";

import { DashboardOpenButton } from "@/components/dashboard-open-button";
import { LogoutButton } from "@/components/logout-button";
import { getButtonClassName } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCurrentSession } from "@/server/current-session";
import {
  listAccountActiveSessions,
  listAccountDashboardResults,
} from "@/server/repositories/dashboard";

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

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const [activeSessions, results] = session
    ? await Promise.all([
        listAccountActiveSessions(session.accountId),
        listAccountDashboardResults(session.accountId),
      ])
    : [[], []];

  return (
    <div className="container-shell py-12 sm:py-16">
      <header className="flex flex-col gap-6 border-b border-white/12 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono-label text-aperture">Ruang pribadi</p>
          <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
            Sesi, hasil, dan kontrol datamu
          </h1>
          <p className="text-ink-muted mt-3 max-w-2xl leading-7">
            Lanjutkan asesmen yang belum selesai atau kelola hasil, tautan berbagi, ekspor, masukan,
            dan penghapusan data.
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
            <p className="text-ink-muted mt-1 text-sm">
              Akses sesi diperbarui saat kamu menekan Lanjutkan.
            </p>
          </div>
          <Link className={getButtonClassName("primary", "sm")} href="/start/modules">
            Mulai asesmen
          </Link>
        </div>
        {activeSessions.length === 0 ? (
          <p className="text-ink-muted bg-surface mt-4 rounded-lg border border-white/12 p-6">
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
                    <p className="text-ink-muted mt-1 text-sm tabular-nums">
                      {item.answeredCount}/{item.totalCount} terjawab · Bagian{" "}
                      {item.currentSegmentIndex}/{item.segmentCount} ·{" "}
                      {sessionStatusLabels[item.status] ?? "Berjalan"}
                    </p>
                    <Progress
                      aria-label={`${item.answeredCount} dari ${item.totalCount} pertanyaan terjawab`}
                      className="mt-3 max-w-xl"
                      max={item.totalCount}
                      value={item.answeredCount}
                    />
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
          <p className="text-ink-muted bg-surface mt-4 rounded-lg border border-white/12 p-6">
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
                    <p className="text-ink-muted mt-1 text-sm">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
                        new Date(result.createdAt),
                      )}{" "}
                      · Versi penilaian {result.scoringVersion}
                    </p>
                    <p className="text-ink-muted mt-1 text-sm tabular-nums">
                      {result.activeShareCount} tautan berbagi aktif
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
        className="mt-12 grid gap-px overflow-hidden rounded-lg border border-white/12 bg-white/12 md:grid-cols-2"
        aria-label="Kontrol akun"
      >
        <article className="bg-surface p-6">
          <h2 className="text-xl font-normal">Privasi dan persetujuan</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Periksa persetujuan opsional, masa penyimpanan, ekspor, dan penghapusan data.
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
          <p className="text-ink-muted mt-3 leading-7">
            Penghapusan permanen mencakup sesi, jawaban, hasil, tautan berbagi, masukan, dan data
            akun terkait.
          </p>
          <Link
            className="focus-ring border-danger-soft text-danger hover:bg-danger-soft mt-5 inline-flex min-h-11 items-center rounded-md border px-5 py-3 text-sm transition-colors duration-150 ease-out"
            href="/dashboard/privacy#delete-account-title"
          >
            Kelola penghapusan akun
          </Link>
        </article>
      </section>
    </div>
  );
}

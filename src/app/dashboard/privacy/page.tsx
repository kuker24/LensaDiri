import Link from "next/link";

import { ConsentDecisionControl } from "@/components/consent-decision-control";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentSession } from "@/server/current-session";
import { listAccountConsentPolicies } from "@/server/repositories/privacy";

const consentLabels = {
  ai_feature_optional: "Fitur naratif AI",
  assessment_processing: "Pemrosesan asesmen",
  marketing_optional: "Komunikasi produk",
  research_optional: "Evaluasi kualitas",
  result_storage: "Penyimpanan hasil",
} as const;

export default async function DashboardPrivacyPage() {
  const session = await getCurrentSession();
  const policies = session ? await listAccountConsentPolicies(session.accountId) : [];

  return (
    <div className="task-shell">
      <Link className="focus-ring quiet-link rounded-[2px] text-sm font-medium" href="/dashboard">
        ← Ruang pribadi
      </Link>
      <header className="mt-6 max-w-3xl">
        <p className="mono-label text-ink">Privasi</p>
        <h1 className="mt-3 text-3xl font-normal tracking-[-0.035em] sm:text-4xl">Pusat privasi</h1>
        <p className="text-ink-muted mt-4 max-w-2xl leading-7">
          Persetujuan dicatat sebagai riwayat. Keputusan terbaru yang berlaku.
        </p>
      </header>

      <section className="mt-10 max-w-4xl" aria-labelledby="consent-heading">
        <h2 className="text-2xl font-normal" id="consent-heading">
          Persetujuan & pemrosesan
        </h2>
        <div className="mt-5 space-y-4">
          {policies.map((policy) => (
            <article
              className="border-line bg-surface rounded-md border p-6"
              key={`${policy.consentType}-${policy.version}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">{consentLabels[policy.consentType]}</h3>
                <Badge tone="neutral">
                  {policy.requiredForCore ? "Wajib untuk fungsi inti" : "Opsional"}
                </Badge>
              </div>
              <p className="text-ink-muted mt-3 leading-7">{policy.purpose}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-semibold">Versi</dt>
                  <dd className="text-ink-muted mt-1">{policy.version}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Data</dt>
                  <dd className="text-ink-muted mt-1">{policy.retentionSubject}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Retensi</dt>
                  <dd className="text-ink-muted mt-1 tabular-nums">
                    {policy.retentionDays
                      ? `${policy.retentionDays} hari`
                      : "Sampai dihapus pengguna"}
                  </dd>
                </div>
              </dl>
              {policy.requiredForCore ? (
                <p className="text-ink-muted mt-4 text-sm">
                  Persetujuan wajib diberikan saat memulai asesmen. Penghapusan hasil atau akun
                  menghentikan penyimpanan terkait.
                </p>
              ) : (
                <ConsentDecisionControl
                  consentType={policy.consentType}
                  decision={policy.decision}
                  version={policy.version}
                />
              )}
            </article>
          ))}
        </div>
      </section>

      <section
        className="border-lens/15 bg-lens-soft/55 mt-10 max-w-4xl rounded-md border p-6"
        aria-labelledby="retention-heading"
      >
        <h2 className="text-xl font-semibold" id="retention-heading">
          Pembersihan data kedaluwarsa
        </h2>
        <p className="text-ink-muted mt-3 leading-7">
          Sesi tamu yang kedaluwarsa dan catatan pembatasan permintaan lama dibersihkan otomatis
          sesuai jadwal. Hasil akun tidak dihapus otomatis dan tetap berada di bawah kontrol
          pengguna.
        </p>
      </section>

      <section
        className="border-danger/30 bg-danger-soft mt-10 max-w-4xl rounded-md border p-6 sm:p-8"
        aria-labelledby="delete-account-title"
      >
        <h2 className="text-danger text-2xl font-semibold" id="delete-account-title">
          Hapus akun permanen
        </h2>
        <p className="text-ink mt-3 max-w-3xl leading-7">
          Tindakan ini menghapus permanen akun beserta sesi, persetujuan, asesmen, jawaban, hasil,
          tautan berbagi, masukan, dan data terkait. Tindakan ini tidak dapat dibatalkan.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}

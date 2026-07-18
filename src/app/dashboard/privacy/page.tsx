import Link from "next/link";

import { ConsentDecisionControl } from "@/components/consent-decision-control";
import { DeleteAccountForm } from "@/components/delete-account-form";
import { Badge } from "@/components/ui/badge";
import { getCurrentSession } from "@/server/current-session";
import { listAccountConsentPolicies } from "@/server/repositories/privacy";

function formatConsentType(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function DashboardPrivacyPage() {
  const session = await getCurrentSession();
  const policies = session ? await listAccountConsentPolicies(session.accountId) : [];

  return (
    <main className="container-shell py-14 sm:py-20">
      <Link
        className="focus-ring rounded text-sm font-semibold text-lens hover:underline"
        href="/dashboard"
      >
        Kembali ke dashboard
      </Link>
      <header className="mt-6 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Pusat privasi
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-ink-muted">
          Consent dicatat sebagai ledger append-only. Keputusan terbaru berlaku, sedangkan riwayat
          lama tetap tersedia untuk audit internal tanpa diekspos ke browser.
        </p>
      </header>

      <section className="mt-10 max-w-4xl" aria-labelledby="consent-heading">
        <h2 className="font-display text-2xl font-semibold" id="consent-heading">
          Consent dan tujuan pemrosesan
        </h2>
        <div className="mt-5 space-y-4">
          {policies.map((policy) => (
            <article
              className="rounded-lg border border-line bg-white p-6"
              key={`${policy.consentType}-${policy.version}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold capitalize">
                  {formatConsentType(policy.consentType)}
                </h3>
                <Badge tone="neutral">
                  {policy.requiredForCore ? "Wajib untuk fungsi inti" : "Opsional"}
                </Badge>
              </div>
              <p className="mt-3 leading-7 text-ink-muted">{policy.purpose}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-semibold">Versi</dt>
                  <dd className="mt-1 text-ink-muted">{policy.version}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Data</dt>
                  <dd className="mt-1 text-ink-muted">{policy.retentionSubject}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Retensi</dt>
                  <dd className="tabular-nums mt-1 text-ink-muted">
                    {policy.retentionDays
                      ? `${policy.retentionDays} hari`
                      : "Sampai dihapus pengguna"}
                  </dd>
                </div>
              </dl>
              {policy.requiredForCore ? (
                <p className="mt-4 text-sm text-ink-muted">
                  Keputusan fungsi inti dibuat pada saat memulai assessment. Penghapusan hasil atau
                  akun menghentikan penyimpanan terkait.
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
        className="mt-10 max-w-4xl rounded-lg border border-lens-soft bg-lens-soft/40 p-6"
        aria-labelledby="retention-heading"
      >
        <h2 className="font-display text-xl font-semibold" id="retention-heading">
          Retention cleanup
        </h2>
        <p className="mt-3 leading-7 text-ink-muted">
          Sesi guest kedaluwarsa dan bucket rate limit lama dibersihkan oleh trusted scheduled job.
          Hasil akun tidak dihapus otomatis dan tetap berada di bawah kontrol pengguna.
        </p>
      </section>

      <section
        className="mt-10 max-w-4xl rounded-lg border border-danger-soft bg-danger-soft p-6 sm:p-8"
        aria-labelledby="delete-account-title"
      >
        <h2 className="font-display text-2xl font-semibold text-danger" id="delete-account-title">
          Hapus akun permanen
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-ink">
          Operasi ini hard-delete akun beserta session, consent, assessment, jawaban, hasil modular,
          share token, feedback, dan data turunan melalui cascade yang telah diuji. Operasi tidak
          dapat dibatalkan.
        </p>
        <DeleteAccountForm />
      </section>
    </main>
  );
}

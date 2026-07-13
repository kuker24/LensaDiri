import Link from "next/link";

import { DeleteAccountForm } from "@/components/delete-account-form";

export default function DashboardPrivacyPage() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <Link
        className="focus-ring rounded text-sm font-semibold text-violet-700 hover:underline"
        href="/dashboard"
      >
        Kembali ke dashboard
      </Link>
      <div className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pusat privasi</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
          Kamu memegang kendali atas akun dan data pribadi. Fitur export, consent, serta penghapusan
          hasil akan bertambah bersama assessment.
        </p>
      </div>

      <section
        className="mt-10 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8"
        aria-labelledby="delete-account-title"
      >
        <h2 className="text-2xl font-semibold text-red-950" id="delete-account-title">
          Hapus akun permanen
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-red-950">
          Operasi ini menghapus akun, seluruh session, consent, dan audit terkait. Setelah
          assessment aktif, hasil serta share token milik akun juga wajib ikut terhapus. Operasi
          tidak dapat dibatalkan.
        </p>
        <DeleteAccountForm />
      </section>
    </section>
  );
}

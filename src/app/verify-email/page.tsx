import type { Metadata } from "next";

import { VerifyEmailRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  robots: { follow: false, index: false },
};

export default function VerifyEmailPage() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="mx-auto max-w-xl rounded-lg border border-line bg-white p-7 shadow-surface sm:p-10">
        <p className="text-sm font-semibold text-lens">Keamanan akun</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink">Verifikasi email</h1>
        <p className="mt-3 leading-7 text-ink-muted">
          Gunakan link sekali pakai dalam 30 menit. Token tidak disimpan dalam bentuk mentah.
        </p>
        <div className="mt-7">
          <VerifyEmailRecoveryForm />
        </div>
      </div>
    </section>
  );
}

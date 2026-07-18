import type { Metadata } from "next";

import { VerifyEmailRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  robots: { follow: false, index: false },
};

export default function VerifyEmailPage() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="surface-panel lens-glow mx-auto max-w-xl p-7 sm:p-10">
        <p className="text-lens text-sm font-semibold">Keamanan akun</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold">Verifikasi email</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Gunakan link sekali pakai dalam 30 menit. Token tidak disimpan dalam bentuk mentah.
        </p>
        <div className="mt-7">
          <VerifyEmailRecoveryForm />
        </div>
      </div>
    </section>
  );
}

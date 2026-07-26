import type { Metadata } from "next";

import { VerifyEmailRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  robots: { follow: false, index: false },
};

export default function VerifyEmailPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <div className="bg-surface lens-glow mx-auto max-w-xl rounded-[1.2rem] border border-white/14 p-7 sm:p-10">
        <p className="mono-label text-aperture">Keamanan akun</p>
        <h1 className="text-ink mt-4 text-3xl font-medium tracking-[-0.03em]">Verifikasi email</h1>
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

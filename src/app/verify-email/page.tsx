import type { Metadata } from "next";

import { VerifyEmailRecoveryForm } from "@/components/account-recovery-form";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Verifikasi Email",
  robots: { follow: false, index: false },
};

export default function VerifyEmailPage() {
  return (
    <section className="task-shell">
      <Reveal className="auth-panel lens-glow mx-auto max-w-xl p-7 sm:p-10">
        <p className="mono-label text-ink">Keamanan</p>
        <h1 className="text-ink mt-4 text-3xl font-normal tracking-[-0.03em]">Verifikasi email</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Link sekali pakai dalam 30 menit. Token tidak disimpan mentah.
        </p>
        <div className="mt-7">
          <VerifyEmailRecoveryForm />
        </div>
      </Reveal>
    </section>
  );
}

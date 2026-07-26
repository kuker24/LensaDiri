import type { Metadata } from "next";
import Link from "next/link";

import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Lupa Password",
  robots: { follow: false, index: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <div className="bg-surface lens-glow mx-auto max-w-xl rounded-[1.2rem] border border-white/14 p-7 sm:p-10">
        <p className="mono-label text-aperture">Pemulihan akun</p>
        <h1 className="text-ink mt-4 text-3xl font-medium tracking-[-0.03em]">Lupa password</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Masukkan email. Respons tetap sama, baik akun ditemukan maupun tidak.
        </p>
        <div className="mt-7">
          <AccountRecoveryForm mode="forgot" />
        </div>
        <Link
          className="focus-ring text-aperture hover:text-ink mt-6 inline-flex min-h-11 items-center rounded-md font-medium transition-colors"
          href="/login"
        >
          ← Kembali ke login
        </Link>
      </div>
    </section>
  );
}

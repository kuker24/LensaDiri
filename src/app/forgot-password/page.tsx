import type { Metadata } from "next";
import Link from "next/link";

import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Lupa Password",
  robots: { follow: false, index: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="surface-panel lens-glow mx-auto max-w-xl p-7 sm:p-10">
        <p className="text-lens text-sm font-semibold">Pemulihan akun</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold">Lupa password</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Masukkan email. Respons tetap sama, baik akun ditemukan maupun tidak.
        </p>
        <div className="mt-7">
          <AccountRecoveryForm mode="forgot" />
        </div>
        <Link
          className="focus-ring text-lens mt-6 inline-flex rounded font-semibold hover:underline"
          href="/login"
        >
          Kembali ke login
        </Link>
      </div>
    </section>
  );
}

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
      <div className="mx-auto max-w-xl rounded-lg border border-line bg-white p-7 shadow-surface sm:p-10">
        <p className="text-sm font-semibold text-lens">Pemulihan akun</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink">Lupa password</h1>
        <p className="mt-3 leading-7 text-ink-muted">
          Masukkan email. Respons tetap sama, baik akun ditemukan maupun tidak.
        </p>
        <div className="mt-7">
          <AccountRecoveryForm mode="forgot" />
        </div>
        <Link
          className="focus-ring mt-6 inline-flex rounded font-semibold text-lens hover:underline"
          href="/login"
        >
          Kembali ke login
        </Link>
      </div>
    </section>
  );
}

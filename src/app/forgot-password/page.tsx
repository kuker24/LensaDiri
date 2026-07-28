import type { Metadata } from "next";
import Link from "next/link";

import { AccountRecoveryForm } from "@/components/account-recovery-form";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  robots: { follow: false, index: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="task-shell">
      <Reveal className="auth-panel lens-glow mx-auto max-w-xl p-7 sm:p-10">
        <p className="mono-label text-ink">Pemulihan</p>
        <h1 className="text-ink mt-4 text-3xl font-normal tracking-[-0.03em]">Lupa kata sandi</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Masukkan email. Jika akun tersedia, petunjuk akan dikirim tanpa mengungkap status akun.
        </p>
        <div className="mt-7">
          <AccountRecoveryForm mode="forgot" />
        </div>
        <Link
          className="focus-ring quiet-link mt-6 inline-flex min-h-11 items-center rounded-[12px] font-medium"
          href="/login"
        >
          ← Kembali masuk
        </Link>
      </Reveal>
    </section>
  );
}

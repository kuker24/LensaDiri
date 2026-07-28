import type { Metadata } from "next";

import { AccountRecoveryForm } from "@/components/account-recovery-form";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi",
  robots: { follow: false, index: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="task-shell">
      <Reveal className="auth-panel lens-glow mx-auto max-w-xl p-7 sm:p-10">
        <p className="mono-label text-ink">Pemulihan</p>
        <h1 className="text-ink mt-4 text-3xl font-normal tracking-[-0.03em]">
          Atur kata sandi baru
        </h1>
        <p className="text-ink-muted mt-3 leading-7">Gunakan tautan sekali pakai dalam 30 menit.</p>
        <div className="mt-7">
          <AccountRecoveryForm mode="reset" />
        </div>
      </Reveal>
    </section>
  );
}

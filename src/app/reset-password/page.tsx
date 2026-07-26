import type { Metadata } from "next";

import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { follow: false, index: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <div className="bg-surface lens-glow mx-auto max-w-xl rounded-[1.2rem] border border-white/14 p-7 sm:p-10">
        <p className="mono-label text-aperture">Pemulihan akun</p>
        <h1 className="text-ink mt-4 text-3xl font-medium tracking-[-0.03em]">
          Atur password baru
        </h1>
        <p className="text-ink-muted mt-3 leading-7">
          Link hanya dapat dipakai sekali dan kedaluwarsa dalam 30 menit.
        </p>
        <div className="mt-7">
          <AccountRecoveryForm mode="reset" />
        </div>
      </div>
    </section>
  );
}

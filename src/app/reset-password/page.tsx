import type { Metadata } from "next";

import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { follow: false, index: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="surface-panel lens-glow mx-auto max-w-xl p-7 sm:p-10">
        <p className="text-lens text-sm font-semibold">Pemulihan akun</p>
        <h1 className="text-ink mt-2 text-3xl font-semibold">Atur password baru</h1>
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

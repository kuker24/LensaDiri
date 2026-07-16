import type { Metadata } from "next";

import { AccountRecoveryForm } from "@/components/account-recovery-form";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { follow: false, index: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="mx-auto max-w-xl rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[var(--shadow)] sm:p-10">
        <p className="text-sm font-semibold text-violet-700">Pemulihan akun</p>
        <h1 className="mt-2 text-3xl font-semibold">Atur password baru</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Link hanya dapat dipakai sekali dan kedaluwarsa dalam 30 menit.
        </p>
        <div className="mt-7">
          <AccountRecoveryForm mode="reset" />
        </div>
      </div>
    </section>
  );
}

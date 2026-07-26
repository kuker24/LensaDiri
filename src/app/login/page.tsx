import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun LensaDiri.",
  robots: { follow: false, index: false },
};

export default function LoginPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[1.2rem] border border-white/14 md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-lens text-canvas flex flex-col justify-between p-7 sm:p-10">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] uppercase">Ruang pribadimu</p>
          <h1 className="mt-20 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
            Lanjutkan eksplorasi dengan aman.
          </h1>
          <p className="text-canvas mt-5 max-w-md leading-7">
            Session disimpan dalam cookie HttpOnly. Password, token mentah, dan jawaban pribadi
            tidak pernah dikirim ke metadata publik.
          </p>
        </div>
        <div className="bg-surface p-7 sm:p-10">
          <p className="mono-label text-ink-muted">Akses akun</p>
          <h2 className="text-ink mt-3 text-2xl font-medium">Masuk</h2>
          <p className="text-ink-muted mt-2">Gunakan email dan password akunmu.</p>
          <div className="mt-7">
            <AuthForm mode="login" />
          </div>
          <p className="text-ink-muted mt-6 text-sm">
            Lupa password?{" "}
            <Link
              className="focus-ring text-aperture hover:text-ink rounded font-medium transition-colors"
              href="/forgot-password"
            >
              Reset password
            </Link>
          </p>
          <p className="text-ink-muted mt-3 text-sm">
            Belum verifikasi email?{" "}
            <Link
              className="focus-ring text-aperture hover:text-ink rounded font-medium transition-colors"
              href="/verify-email"
            >
              Kirim ulang verifikasi
            </Link>
          </p>
          <p className="text-ink-muted mt-3 text-sm">
            Belum punya akun?{" "}
            <Link
              className="focus-ring text-aperture hover:text-ink rounded font-medium transition-colors"
              href="/register"
            >
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

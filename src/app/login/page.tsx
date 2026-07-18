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
    <section className="container-shell py-14 sm:py-20">
      <div className="border-line shadow-surface mx-auto grid max-w-4xl overflow-hidden rounded-lg border bg-white md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-lens-strong text-canvas p-7 sm:p-10">
          <p className="text-aperture-on-dark text-sm font-semibold">Ruang pribadimu</p>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
            Lanjutkan eksplorasi dengan aman.
          </h1>
          <p className="text-canvas/85 mt-5 max-w-md leading-7">
            Session disimpan dalam cookie HttpOnly. Password, token mentah, dan jawaban pribadi
            tidak pernah dikirim ke metadata publik.
          </p>
        </div>
        <div className="p-7 sm:p-10">
          <h2 className="font-display text-ink text-2xl font-semibold">Masuk</h2>
          <p className="text-ink-muted mt-2">Gunakan email dan password akunmu.</p>
          <div className="mt-7">
            <AuthForm mode="login" />
          </div>
          <p className="text-ink-muted mt-6 text-sm">
            Belum punya akun?{" "}
            <Link
              className="focus-ring text-lens rounded font-semibold hover:underline"
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

import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun LensaDiri untuk menyimpan progres secara privat.",
  robots: { follow: false, index: false },
};

export default function RegisterPage() {
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="border-line shadow-surface mx-auto grid max-w-4xl overflow-hidden rounded-lg border bg-white md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-lens-strong text-canvas p-7 sm:p-10">
          <p className="text-aperture-on-dark text-sm font-semibold">Private by default</p>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
            Simpan progres, tetap pegang kendali.
          </h1>
          <ul className="text-canvas/85 mt-6 space-y-3 leading-7">
            <li>Hasil tidak menjadi publik otomatis.</li>
            <li>Berbagi selalu membutuhkan aksi eksplisit.</li>
            <li>Akun dan data terkait dapat dihapus permanen.</li>
          </ul>
        </div>
        <div className="p-7 sm:p-10">
          <h2 className="font-display text-ink text-2xl font-semibold">Buat akun</h2>
          <p className="text-ink-muted mt-2">Mulai dengan email aktif dan password kuat.</p>
          <div className="mt-7">
            <AuthForm mode="register" />
          </div>
          <p className="text-ink-muted mt-6 text-sm">
            Sudah punya akun?{" "}
            <Link
              className="focus-ring text-lens rounded font-semibold hover:underline"
              href="/login"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

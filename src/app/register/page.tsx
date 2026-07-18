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
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-lg border border-line bg-white shadow-surface md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-lens-strong p-7 text-canvas sm:p-10">
          <p className="text-sm font-semibold text-aperture">Private by default</p>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight">
            Simpan progres, tetap pegang kendali.
          </h1>
          <ul className="mt-6 space-y-3 leading-7 text-canvas/85">
            <li>Hasil tidak menjadi publik otomatis.</li>
            <li>Berbagi selalu membutuhkan aksi eksplisit.</li>
            <li>Akun dan data terkait dapat dihapus permanen.</li>
          </ul>
        </div>
        <div className="p-7 sm:p-10">
          <h2 className="font-display text-2xl font-semibold text-ink">Buat akun</h2>
          <p className="mt-2 text-ink-muted">Mulai dengan email aktif dan password kuat.</p>
          <div className="mt-7">
            <AuthForm mode="register" />
          </div>
          <p className="mt-6 text-sm text-ink-muted">
            Sudah punya akun?{" "}
            <Link
              className="focus-ring rounded font-semibold text-lens hover:underline"
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

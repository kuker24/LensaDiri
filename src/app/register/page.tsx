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
    <section className="container-shell py-16 sm:py-24">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[1.2rem] border border-white/14 md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-lens text-canvas flex flex-col justify-between p-7 sm:p-10">
          <p className="font-mono text-[0.65rem] tracking-[0.16em] uppercase">Private by default</p>
          <h1 className="mt-20 text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
            Simpan progres, tetap pegang kendali.
          </h1>
          <ul className="text-canvas mt-6 space-y-3 leading-7">
            <li>Hasil tidak menjadi publik otomatis.</li>
            <li>Berbagi selalu membutuhkan aksi eksplisit.</li>
            <li>Akun dan data terkait dapat dihapus permanen.</li>
          </ul>
        </div>
        <div className="bg-surface p-7 sm:p-10">
          <p className="mono-label text-ink-muted">Akun privat</p>
          <h2 className="text-ink mt-3 text-2xl font-medium">Buat akun</h2>
          <p className="text-ink-muted mt-2">Mulai dengan email aktif dan password kuat.</p>
          <div className="mt-7">
            <AuthForm mode="register" />
          </div>
          <p className="text-ink-muted mt-6 text-sm">
            Sudah punya akun?{" "}
            <Link
              className="focus-ring text-aperture hover:text-ink rounded font-medium transition-colors"
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

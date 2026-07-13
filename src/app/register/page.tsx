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
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[var(--shadow)] md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-violet-700 p-7 text-white sm:p-10">
          <p className="text-sm font-semibold text-violet-100">Private by default</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Simpan progres, tetap pegang kendali.
          </h1>
          <ul className="mt-6 space-y-3 leading-7 text-violet-50">
            <li>Hasil tidak menjadi publik otomatis.</li>
            <li>Berbagi selalu membutuhkan aksi eksplisit.</li>
            <li>Akun dan data terkait dapat dihapus permanen.</li>
          </ul>
        </div>
        <div className="p-7 sm:p-10">
          <h2 className="text-2xl font-semibold">Buat akun</h2>
          <p className="mt-2 text-[var(--muted)]">Mulai dengan email aktif dan password kuat.</p>
          <div className="mt-7">
            <AuthForm mode="register" />
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            Sudah punya akun?{" "}
            <Link
              className="focus-ring rounded font-semibold text-violet-700 hover:underline"
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

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
        <div className="bg-surface relative flex flex-col justify-between overflow-hidden p-7 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgb(175_80_255_/_0.22),transparent_16rem)]"
          />
          <p className="mono-label text-aperture relative">Private by default</p>
          <h1 className="relative mt-20 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
            Simpan progres, tetap pegang kendali.
          </h1>
          <ul className="text-steel relative mt-6 space-y-3 leading-7">
            <li>Hasil tidak menjadi publik otomatis.</li>
            <li>Berbagi selalu membutuhkan aksi eksplisit.</li>
            <li>Akun dan data terkait dapat dihapus permanen.</li>
          </ul>
        </div>
        <div className="bg-surface-raised/40 border-t border-white/10 p-7 sm:p-10 md:border-t-0 md:border-l">
          <p className="mono-label text-steel">Akun privat</p>
          <h2 className="mt-3 text-2xl font-normal">Buat akun</h2>
          <p className="text-steel mt-2">Mulai dengan email aktif dan password kuat.</p>
          <div className="mt-7">
            <AuthForm mode="register" />
          </div>
          <p className="text-steel mt-6 text-sm">
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

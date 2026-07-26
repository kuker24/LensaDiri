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
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[20px] border border-white/14 md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-surface relative flex flex-col justify-between overflow-hidden p-7 sm:p-10">
          <p className="mono-label text-aperture relative">Ruang pribadimu</p>
          <h1 className="relative mt-20 text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
            Lanjutkan eksplorasi dengan aman.
          </h1>
          <p className="text-ink-muted relative mt-5 max-w-md leading-7">
            Sesi masuk dilindungi. Kata sandi, kode akses, dan jawaban pribadi tidak ditampilkan
            pada halaman publik.
          </p>
        </div>
        <div className="bg-surface-raised/40 border-t border-white/10 p-7 sm:p-10 md:border-t-0 md:border-l">
          <p className="mono-label text-ink-muted">Akses akun</p>
          <h2 className="mt-3 text-2xl font-normal">Masuk</h2>
          <p className="text-ink-muted mt-2">Gunakan email dan kata sandi akunmu.</p>
          <div className="mt-7">
            <AuthForm mode="login" />
          </div>
          <p className="text-ink-muted mt-6 text-sm">
            Lupa kata sandi?{" "}
            <Link
              className="focus-ring text-aperture hover:text-ink rounded font-medium transition-colors"
              href="/forgot-password"
            >
              Atur ulang kata sandi
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

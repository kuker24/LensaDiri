import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun LensaDiri untuk menyimpan progres secara privat.",
  robots: { follow: false, index: false },
};

export default function RegisterPage() {
  return (
    <section className="task-shell">
      <Reveal className="auth-panel mx-auto grid max-w-4xl md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-surface relative flex flex-col justify-between overflow-hidden p-7 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url(/media/design2/panel-void-detail.jpg)] bg-cover bg-center opacity-25"
          />
          <div className="relative">
            <p className="mono-label text-ink">Privat sejak awal</p>
            <h1 className="mt-8 max-w-sm text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
              Simpan progres. Tetap pegang kendali.
            </h1>
            <ul className="text-ink-muted mt-6 space-y-3 leading-7">
              <li>Hasil tidak publik otomatis.</li>
              <li>Berbagi butuh aksi eksplisit.</li>
              <li>Akun dapat dihapus permanen.</li>
            </ul>
          </div>
        </div>
        <div className="bg-surface-raised/40 border-t border-white/10 p-7 sm:p-10 md:border-t-0 md:border-l">
          <p className="mono-label text-ink-muted">Akun privat</p>
          <h2 className="mt-3 text-2xl font-normal">Buat akun</h2>
          <p className="text-ink-muted mt-2">Email aktif dan kata sandi kuat.</p>
          <div className="mt-7">
            <AuthForm mode="register" />
          </div>
          <p className="text-ink-muted mt-6 text-sm">
            Sudah punya akun?{" "}
            <Link className="focus-ring quiet-link rounded font-medium" href="/login">
              Masuk
            </Link>
          </p>
        </div>
      </Reveal>
    </section>
  );
}

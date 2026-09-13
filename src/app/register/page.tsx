import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { OidcButtons } from "@/components/oidc-buttons";
import { Reveal } from "@/components/reveal";
import { getServerEnvironment } from "@/lib/db/env";

export const metadata: Metadata = {
  title: "Daftar",
  description: "Buat akun LensaDiri untuk menyimpan progres refleksi secara privat.",
  robots: { follow: false, index: false },
};

function ArrowUpRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

export default function RegisterPage() {
  const environment = getServerEnvironment();
  const providers = environment.googleOidc ? (["google"] as const) : [];

  return (
    <section className="bg-canvas text-ink relative min-h-[calc(100svh-3.5rem)] px-4 py-12 sm:px-6 lg:px-8">
      {/* Organic multi-hue ambient radial mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,rgba(16,185,129,0.08)_0%,transparent_60%),radial-gradient(ellipse_70%_50%_at_80%_25%,rgba(56,189,248,0.12)_0%,transparent_60%),radial-gradient(ellipse_60%_60%_at_50%_80%,rgba(168,85,247,0.08)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-5xl">
        <Reveal className="border-line bg-surface grid overflow-hidden rounded-[32px] border shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_50px_rgba(56,189,248,0.06)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left: Atmospheric Living Showcase Canvas */}
          <div className="border-line relative order-2 flex flex-col justify-between overflow-hidden border-t p-8 sm:p-12 lg:order-1 lg:border-t-0 lg:border-r">
            {/* Subtle background glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl"
            />

            <div className="relative">
              {/* Pill badge with warm multi-hue indicator */}
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-950/50 px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider text-sky-300 uppercase shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                <span className="bg-iris h-1.5 w-1.5 rounded-full" />
                <span>Registrasi Privat</span>
              </div>

              <h1 className="mt-6 font-sans text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Buka ruang pemahaman dirimu.
              </h1>

              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Simpan progres refleksi secara terenkripsi, pantau perubahan spektrum diri dari
                waktu ke waktu, dan kendalikan data pribadimu dengan penuh kebebasan.
              </p>

              {/* Multi-Dimensional Value Cards */}
              <div className="mt-8 space-y-3">
                <div className="border-line bg-surface-raised rounded-2xl border p-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 font-mono text-xs font-bold text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                      🌿
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold">Hasil Tidak Publik Otomatis</h2>
                      <p className="text-xs leading-relaxed text-slate-400">
                        Skor dan analisis tersimpan di ruang aman pribadi. Tidak ada profil publik
                        tanpa izin eksplisitmu.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-line bg-surface-raised rounded-2xl border p-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 font-mono text-xs font-bold text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]">
                      💎
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold">Berbagi Butuh Aksi Eksplisit</h2>
                      <p className="text-xs leading-relaxed text-slate-400">
                        Tautan berbagi hanya tercipta saat kamu memilih untuk berdiskusi dengan
                        orang terpercaya, dan bisa dicabut kapan saja.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-line bg-surface-raised rounded-2xl border p-4 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 font-mono text-xs font-bold text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                      🗑️
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold">Akun Dapat Dihapus Permanen</h2>
                      <p className="text-xs leading-relaxed text-slate-400">
                        Tersedia tombol hapus tuntas tanpa retensi bayangan. Hak kendali penuh tetap
                        berada di tanganmu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Mode Shortcut */}
            <div className="border-line bg-surface-raised relative mt-8 rounded-2xl border bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-purple-950/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold">Mau mencoba dulu tanpa mendaftar?</p>
                  <p className="text-[11px] text-slate-400">
                    Gunakan mode tamu instan tanpa identitas pribadi.
                  </p>
                </div>
                <Link
                  href="/start"
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3.5 py-2 text-xs font-semibold text-sky-300 transition-[transform,background-color] duration-150 ease-out hover:border-sky-400/60 hover:bg-sky-500/20 active:scale-[0.97]"
                >
                  <span>Mulai Tamu</span>
                  <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Polished High-Precision Form Panel */}
          <div className="bg-surface-raised order-1 flex flex-col justify-between p-8 sm:p-12 lg:order-2">
            <div>
              {/* Tabbed Mode Switcher */}
              <div className="border-line bg-surface-raised inline-flex rounded-2xl border p-1">
                <Link
                  href="/login"
                  className="text-ink-muted hover:text-ink inline-flex min-h-[44px] items-center rounded-xl px-4 py-1.5 text-xs font-medium transition-colors"
                >
                  Masuk
                </Link>
                <span className="inline-flex min-h-[44px] items-center rounded-xl border border-sky-400/30 bg-sky-500/15 px-4 py-1.5 text-xs font-semibold text-sky-300 shadow-sm">
                  Daftar
                </span>
              </div>

              <div className="mt-8">
                <span className="font-mono text-xs tracking-wider text-sky-400 uppercase">
                  Akses Akun
                </span>
                <h2 className="mt-2 font-sans text-2xl font-semibold sm:text-3xl">
                  Buat Akun Baru
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Pilih Google atau gunakan email dan kata sandi.
                </p>
              </div>

              <div className="mt-8">
                <OidcButtons providers={[...providers]} />

                {providers.length > 0 ? (
                  <div className="my-6 flex items-center gap-3" aria-hidden="true">
                    <span className="border-line flex-1 border-t" />
                    <span className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">
                      atau email
                    </span>
                    <span className="border-line flex-1 border-t" />
                  </div>
                ) : null}

                <AuthForm mode="register" />
              </div>
            </div>

            <div className="border-line mt-8 border-t pt-6">
              <p className="text-sm text-slate-400">
                Sudah punya akun?{" "}
                <Link
                  className="focus-ring rounded font-semibold text-sky-400 underline underline-offset-4 hover:text-sky-300"
                  href="/login"
                >
                  Masuk
                </Link>
              </p>
              <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                <span>🔒</span>
                <span>Data dienkripsi secara aman dengan standar Argon2id</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

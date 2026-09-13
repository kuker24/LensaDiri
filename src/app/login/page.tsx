import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { OidcButtons } from "@/components/oidc-buttons";
import { BlurFade } from "@/components/ui/blur-fade";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getServerEnvironment } from "@/lib/db/env";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun LensaDiri untuk mengakses ruang refleksi pribadimu.",
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ authError?: string; redirectTo?: string | string[] }>;
}) {
  const environment = getServerEnvironment();
  const { authError, redirectTo: requestedRedirect } = await searchParams;
  const redirectTo = getSafeRedirectPath(
    typeof requestedRedirect === "string" ? requestedRedirect : undefined,
  );
  const opensPrivateSpace = redirectTo.startsWith("/dashboard");
  const providers = [
    ...(environment.googleOidc ? (["google"] as const) : []),
    ...(environment.appleOidc ? (["apple"] as const) : []),
  ];

  return (
    <section className="bg-canvas text-ink relative min-h-[calc(100svh-3.5rem)] px-4 py-12 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,rgba(17,109,50,0.07)_0%,transparent_60%),radial-gradient(ellipse_70%_50%_at_80%_25%,rgba(157,66,35,0.08)_0%,transparent_60%)]"
      />

      <div className="relative mx-auto max-w-5xl">
        <BlurFade className="border-line bg-surface grid overflow-hidden rounded-[32px] border shadow-[0_32px_80px_rgba(27,28,26,0.22)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-line relative order-2 flex flex-col justify-between overflow-hidden border-t p-8 sm:p-12 lg:order-1 lg:border-t-0 lg:border-r">
            <div
              aria-hidden="true"
              className="bg-success/10 pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full blur-3xl"
            />
            <div
              aria-hidden="true"
              className="bg-iris-wash pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full blur-3xl"
            />

            <div className="relative">
              <div className="border-line-strong bg-iris-wash text-iris inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-[11px] font-semibold tracking-wider uppercase shadow-[0_8px_24px_rgba(157,66,35,0.1)]">
                <span className="bg-iris h-1.5 w-1.5 rounded-full" />
                <span>Ruang Refleksi Pribadi</span>
              </div>

              <h1 className="mt-6 font-sans text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {opensPrivateSpace ? "Buka ruang pribadimu." : "Kembali ke ruang heningmu."}
              </h1>

              <p className="text-ink-muted mt-4 text-base leading-relaxed">
                {opensPrivateSpace
                  ? "Masuk untuk melanjutkan ke sesi, hasil, dan kontrol penuh atas seluruh datamu."
                  : "Lanjutkan eksplorasi diri, telaah kembali dinamika kepribadianmu, dan simpan wawasan penting secara aman."}
              </p>

              <div className="border-line bg-surface-raised mt-8 rounded-2xl border p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted font-mono text-[11px] font-semibold tracking-wider uppercase">
                    Spektrum Wawasan
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    Deterministik
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Spectrum 1: Trait / Emerald */}
                  <div>
                    <div className="text-ink-muted flex justify-between text-xs">
                      <span className="text-success font-medium">🌿 Profil Trait</span>
                      <span className="font-mono">Spektrum Lentur</span>
                    </div>
                    <div className="bg-line mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>

                  {/* Spectrum 2: Kognisi / Sapphire */}
                  <div>
                    <div className="text-ink-muted flex justify-between text-xs">
                      <span className="text-sky-ink font-medium">💎 Pola Pikir</span>
                      <span className="font-mono">Kejernihan Kognitif</span>
                    </div>
                    <div className="bg-line mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                      <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-sky-500 to-indigo-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                    </div>
                  </div>

                  {/* Spectrum 3: Motivasi / Warm Amber */}
                  <div>
                    <div className="text-ink-muted flex justify-between text-xs">
                      <span className="text-warning font-medium">🍯 Dorongan Batin</span>
                      <span className="font-mono">Harmoni Relasi</span>
                    </div>
                    <div className="bg-line mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
                      <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                </div>

                <p className="border-line text-ink-muted mt-4 border-t pt-3 text-[11px] leading-relaxed">
                  Skor dihitung deterministik di server. AI tidak pernah mengarang atau memanipulasi
                  skormu.
                </p>
              </div>

              <div className="mt-8 space-y-2.5">
                <div className="text-ink-muted flex items-center gap-2.5 text-xs">
                  <span className="bg-success h-2 w-2 rounded-full" />
                  <span>
                    <strong>100% Privat Bawaan:</strong> Hasilmu tidak pernah diindeks publik atau
                    dibagikan otomatis.
                  </span>
                </div>
                <div className="text-ink-muted flex items-center gap-2.5 text-xs">
                  <span className="bg-iris h-2 w-2 rounded-full" />
                  <span>
                    <strong>Nol Pelacak Iklan:</strong> Bebas Meta Pixel, pelacak komersial, atau
                    penjualan data.
                  </span>
                </div>
                <div className="text-ink-muted flex items-center gap-2.5 text-xs">
                  <span className="bg-warning h-2 w-2 rounded-full" />
                  <span>
                    <strong>Kedaulatan Penuh:</strong> Hapus akun dan riwayat permanen kapan pun
                    kamu inginkan.
                  </span>
                </div>
              </div>
            </div>

            <div className="border-line bg-surface-raised relative mt-8 rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold">Ingin mencoba tanpa akun?</p>
                  <p className="text-ink-muted text-[11px]">
                    Eksplorasi modul bebas sebagai tamu anonim.
                  </p>
                </div>
                <Link
                  href="/start"
                  className="border-line-strong bg-iris-wash text-iris hover:bg-iris-wash/70 inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]"
                >
                  <span>Mulai Tamu</span>
                  <ArrowUpRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-surface-raised order-1 flex flex-col justify-between p-8 sm:p-12 lg:order-2">
            <div>
              <div className="border-line bg-surface-raised inline-flex rounded-2xl border p-1">
                <span className="border-line-strong bg-iris-wash text-iris inline-flex min-h-[44px] items-center rounded-xl border px-4 py-1.5 text-xs font-semibold shadow-sm">
                  Masuk
                </span>
                <Link
                  href="/register"
                  className="text-ink-muted hover:text-ink inline-flex min-h-[44px] items-center rounded-xl px-4 py-1.5 text-xs font-medium transition-colors"
                >
                  Daftar
                </Link>
              </div>

              <div className="mt-8">
                <span className="text-iris font-mono text-xs tracking-wider uppercase">
                  Akses Akun
                </span>
                <h2 className="mt-2 font-sans text-2xl font-semibold sm:text-3xl">Masuk ke Akun</h2>
                <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                  Gunakan email dan kata sandi yang telah kamu daftarkan.
                </p>
              </div>

              <div className="mt-8">
                {authError ? (
                  <p
                    className="border-danger/30 bg-danger-soft text-danger mb-5 rounded-2xl border px-4 py-3 text-sm"
                    role="alert"
                  >
                    {authError === "rate_limited"
                      ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."
                      : authError === "provider_unavailable"
                        ? "Login provider sedang tidak tersedia. Gunakan email dan kata sandi."
                        : authError === "email_collision"
                          ? "Email ini sudah memiliki akun. Masuk dengan kata sandi, lalu tautkan Google di Pengaturan."
                          : "Login provider gagal. Coba lagi atau gunakan email dan kata sandi."}
                  </p>
                ) : null}

                <OidcButtons providers={[...providers]} redirectTo={redirectTo} />

                {providers.length > 0 ? (
                  <div className="my-6 flex items-center gap-3" aria-hidden="true">
                    <span className="border-line flex-1 border-t" />
                    <span className="text-ink-muted font-mono text-[11px] tracking-widest uppercase">
                      atau email
                    </span>
                    <span className="border-line flex-1 border-t" />
                  </div>
                ) : null}

                <AuthForm mode="login" redirectTo={redirectTo} />
              </div>
            </div>

            <div className="border-line mt-8 border-t pt-6">
              <p className="text-ink-muted text-sm">
                Belum punya akun?{" "}
                <Link
                  className="focus-ring text-iris hover:text-iris-deep rounded font-semibold underline underline-offset-4"
                  href="/register"
                >
                  Daftar
                </Link>
              </p>
              <p className="text-ink-muted mt-3 flex items-center gap-1.5 font-mono text-[11px]">
                <span>🔒</span>
                <span>Dilindungi enkripsi server Argon2id & HMAC</span>
              </p>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { BlurFade } from "@/components/ui/blur-fade";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun LensaDiri.",
  robots: { follow: false, index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string | string[] }>;
}) {
  const requestedRedirect = (await searchParams).redirectTo;
  const redirectTo = getSafeRedirectPath(
    typeof requestedRedirect === "string" ? requestedRedirect : undefined,
  );
  const opensPrivateSpace = redirectTo.startsWith("/dashboard");

  return (
    <section className="task-shell">
      <BlurFade className="auth-panel mx-auto grid max-w-4xl border-white/18 md:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-surface relative flex flex-col justify-between overflow-hidden p-7 sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url(/media/design2/panel-void-detail.jpg)] bg-cover bg-center opacity-25"
          />
          <div className="relative">
            <p className="mono-label text-ink">Akses akun</p>
            <h1 className="mt-8 max-w-sm text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
              {opensPrivateSpace ? "Buka ruang pribadimu." : "Lanjutkan dengan aman."}
            </h1>
            <p className="text-ink-muted mt-5 max-w-md leading-7">
              {opensPrivateSpace
                ? "Masuk untuk melanjutkan ke sesi, hasil, dan kontrol datamu."
                : "Sesi dilindungi. Jawaban dan hasil tetap privat."}
            </p>
          </div>
        </div>
        <div className="bg-surface-raised/40 border-t border-white/10 p-7 sm:p-10 md:border-t-0 md:border-l">
          <p className="mono-label text-ink-muted">Akses akun</p>
          <h2 className="mt-3 text-2xl font-normal">Masuk</h2>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            Email dan kata sandi akunmu. Minimal 12 karakter untuk kata sandi.
          </p>
          <div className="mt-7">
            <AuthForm mode="login" redirectTo={redirectTo} />
          </div>
          <p className="text-ink-muted mt-6 text-sm">
            Lupa kata sandi?{" "}
            <Link
              className="focus-ring quiet-link rounded-[12px] font-medium"
              href="/forgot-password"
            >
              Atur ulang
            </Link>
          </p>
          <p className="text-ink-muted mt-3 text-sm">
            Belum verifikasi?{" "}
            <Link className="focus-ring quiet-link rounded-[12px] font-medium" href="/verify-email">
              Kirim ulang
            </Link>
          </p>
          <p className="text-ink-muted mt-3 text-sm">
            Belum punya akun?{" "}
            <Link className="focus-ring quiet-link rounded-[12px] font-medium" href="/register">
              Daftar
            </Link>
          </p>
        </div>
      </BlurFade>
    </section>
  );
}

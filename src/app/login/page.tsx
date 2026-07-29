import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/components/auth-form";
import { OidcButtons } from "@/components/oidc-buttons";
import { BlurFade } from "@/components/ui/blur-fade";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getServerEnvironment } from "@/lib/db/env";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun LensaDiri.",
  robots: { follow: false, index: false },
};

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
            {authError ? (
              <p
                className="border-danger/30 bg-danger-soft text-danger mb-5 rounded-[12px] border px-4 py-3 text-sm"
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
                <span className="text-ink-muted text-xs tracking-[0.14em] uppercase">atau</span>
                <span className="border-line flex-1 border-t" />
              </div>
            ) : null}
            <AuthForm mode="login" redirectTo={redirectTo} />
          </div>
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

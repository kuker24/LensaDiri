"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";

type AuthFormProps = {
  mode: "login" | "register";
  redirectTo?: string;
};

const errorMessages: Record<string, string> = {
  csrf_invalid: "Sesi formulir kedaluwarsa. Muat ulang halaman lalu coba lagi.",
  email_unverified:
    "Email belum diverifikasi. Buka tautan di kotak masuk atau minta ulang dari halaman verifikasi.",
  invalid_body: "Periksa kembali email dan kata sandi.",
  invalid_credentials: "Email atau kata sandi tidak cocok.",
  rate_limited: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  service_unavailable: "Layanan sedang tidak tersedia. Coba lagi nanti.",
};

export function AuthForm({ mode, redirectTo = "/dashboard" }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [registrationAccepted, setRegistrationAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    try {
      await postAuthenticatedMutation(isLogin ? "/api/auth/login" : "/api/auth/register", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      });
      if (isLogin) {
        router.replace(redirectTo);
      } else {
        setRegistrationAccepted(true);
      }
    } catch (caught) {
      const code = caught instanceof AuthApiError ? caught.code : "service_unavailable";
      setError(errorMessages[code] ?? "Permintaan gagal. Coba lagi.");
    } finally {
      setIsPending(false);
    }
  }

  if (registrationAccepted) {
    return (
      <div className="border-success/30 bg-success-soft rounded-[16px] border p-5" role="status">
        <p className="text-success mono-label">Berhasil</p>
        <h2 className="mt-3 text-xl font-medium">Permintaan pendaftaran diterima</h2>
        <p className="text-ink-muted mt-2 leading-7">
          Jika dapat diproses, akun akan disiapkan tanpa mengungkap status email.
        </p>
        <Link
          className="focus-ring quiet-link mt-5 inline-flex min-h-11 items-center rounded-[12px] font-medium"
          href="/login"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          autoComplete="email"
          id={`${mode}-email`}
          inputMode="email"
          maxLength={320}
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`${mode}-password`}>Kata sandi</Label>
          {isLogin ? (
            <Link
              href="/forgot-password"
              className="focus-ring text-iris hover:text-iris-deep inline-flex min-h-[44px] items-center rounded text-xs font-medium transition-colors"
            >
              Lupa kata sandi?
            </Link>
          ) : null}
        </div>
        <div className="relative mt-1">
          <Input
            autoComplete={isLogin ? "current-password" : "new-password"}
            id={`${mode}-password`}
            maxLength={128}
            minLength={12}
            name="password"
            required
            type={showPassword ? "text" : "password"}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="focus-ring text-steel hover:text-ink absolute top-1/2 right-1 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded p-1 transition-colors"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {error ? (
        <p
          className="border-danger/30 bg-danger-soft text-danger rounded-[12px] border px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <Button aria-busy={isPending} className="w-full" disabled={isPending} type="submit">
        {isPending ? "Memproses…" : isLogin ? "Masuk" : "Buat akun"}
      </Button>
    </form>
  );
}

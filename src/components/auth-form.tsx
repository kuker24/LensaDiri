"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";

type AuthFormProps = {
  mode: "login" | "register";
};

const errorMessages: Record<string, string> = {
  csrf_invalid: "Sesi formulir kedaluwarsa. Muat ulang halaman lalu coba lagi.",
  invalid_body: "Periksa email dan password. Password minimal 12 karakter.",
  invalid_credentials: "Email atau password tidak cocok.",
  rate_limited: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  service_unavailable: "Layanan sedang tidak tersedia. Coba lagi nanti.",
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [registrationAccepted, setRegistrationAccepted] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await postAuthenticatedMutation(isLogin ? "/api/auth/login" : "/api/auth/register", {
        email,
        password,
      });
      if (isLogin) {
        router.push("/dashboard");
        router.refresh();
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <h2 className="text-lg font-semibold text-emerald-950">Pendaftaran diterima</h2>
        <p className="mt-2 leading-7 text-emerald-900">
          Jika email belum terdaftar, akun sudah dibuat. Masuk untuk melanjutkan.
        </p>
        <Link
          className="focus-ring mt-5 inline-flex rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white"
          href="/login"
        >
          Masuk sekarang
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-semibold" htmlFor={`${mode}-email`}>
          Email
        </label>
        <input
          autoComplete="email"
          className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base shadow-sm transition outline-none hover:border-violet-300"
          id={`${mode}-email`}
          inputMode="email"
          maxLength={320}
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor={`${mode}-password`}>
          Password
        </label>
        <input
          aria-describedby={`${mode}-password-help`}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base shadow-sm transition outline-none hover:border-violet-300"
          id={`${mode}-password`}
          maxLength={128}
          minLength={12}
          name="password"
          required
          type="password"
        />
        <p className="mt-2 text-sm text-[var(--muted)]" id={`${mode}-password-help`}>
          Minimal 12 karakter.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        className="focus-ring min-h-12 w-full rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Memproses…" : isLogin ? "Masuk" : "Buat akun"}
      </button>
    </form>
  );
}

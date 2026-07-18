"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

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
      <div className="rounded-md border border-success bg-white p-6" role="status">
        <h2 className="font-display text-lg font-semibold text-success">Pendaftaran diterima</h2>
        <p className="mt-2 leading-7 text-ink-muted">
          Jika email belum terdaftar, akun sudah dibuat. Masuk untuk melanjutkan.
        </p>
        <Link
          className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-sm bg-lens px-5 py-3 font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-lens-strong"
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
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          aria-describedby={`${mode}-password-help`}
          autoComplete={isLogin ? "current-password" : "new-password"}
          id={`${mode}-password`}
          maxLength={128}
          minLength={12}
          name="password"
          required
          type="password"
        />
        <p className="mt-2 text-sm text-ink-muted" id={`${mode}-password-help`}>
          Minimal 12 karakter.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-md border border-danger-soft bg-danger-soft px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Memproses…" : isLogin ? "Masuk" : "Buat akun"}
      </Button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
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

    try {
      await postAuthenticatedMutation(isLogin ? "/api/auth/login" : "/api/auth/register", {
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
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
      <div className="border-success/30 bg-aperture-soft/70 rounded-md border p-5" role="status">
        <p className="text-success text-sm font-semibold tracking-wide uppercase">Berhasil</p>
        <h2 className="mt-2 text-xl font-semibold">Pendaftaran diterima</h2>
        <p className="text-ink-muted mt-2 leading-7">
          Jika email belum terdaftar, akun sudah dibuat. Masuk untuk melanjutkan.
        </p>
        <Link
          className="focus-ring text-lens mt-5 inline-flex min-h-11 items-center font-semibold hover:underline"
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
        <p className="text-ink-muted mt-2 text-sm" id={`${mode}-password-help`}>
          Minimal 12 karakter.
        </p>
      </div>
      {error ? (
        <p
          className="border-danger/30 bg-danger-soft text-danger rounded-md border px-4 py-3 text-sm"
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

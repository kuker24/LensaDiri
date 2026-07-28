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
  email_unverified:
    "Email belum diverifikasi. Buka tautan di kotak masuk atau minta ulang dari halaman verifikasi.",
  invalid_body: "Periksa email dan kata sandi. Kata sandi minimal 12 karakter.",
  invalid_credentials: "Email atau kata sandi tidak cocok.",
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
        <Label htmlFor={`${mode}-password`}>Kata sandi</Label>
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

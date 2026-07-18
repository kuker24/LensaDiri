"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type RecoveryMode = "forgot" | "request-verification" | "reset" | "verify";

const config = {
  forgot: {
    action: "/api/auth/forgot-password",
    button: "Kirim instruksi reset",
    field: "email",
    success: "Jika akun aktif tersedia, instruksi reset sudah disiapkan.",
  },
  "request-verification": {
    action: "/api/auth/request-verification",
    button: "Kirim instruksi verifikasi",
    field: "email",
    success: "Jika akun aktif belum terverifikasi, instruksi sudah disiapkan.",
  },
  reset: {
    action: "/api/auth/reset-password",
    button: "Simpan password baru",
    field: "token",
    success: "Password diperbarui. Semua session lama sudah dicabut.",
  },
  verify: {
    action: "/api/auth/verify-email",
    button: "Verifikasi email",
    field: "token",
    success: "Email berhasil diverifikasi.",
  },
} as const;

function readAndClearRecoveryToken(): string {
  const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
  if (value) window.history.replaceState(null, "", window.location.pathname);
  return value;
}

export function VerifyEmailRecoveryForm() {
  const [fragmentToken, setFragmentToken] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setFragmentToken(readAndClearRecoveryToken()), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <AccountRecoveryForm
      mode={fragmentToken ? "verify" : "request-verification"}
      token={fragmentToken}
    />
  );
}

export function AccountRecoveryForm({ mode, token = "" }: { mode: RecoveryMode; token?: string }) {
  const selected = config[mode];
  const [readToken, setReadToken] = useState("");
  const fragmentToken = token || readToken;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (selected.field !== "token" || token) return;
    const timeout = window.setTimeout(() => setReadToken(readAndClearRecoveryToken()), 0);
    return () => window.clearTimeout(timeout);
  }, [selected.field, token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const data = new FormData(event.currentTarget);
    const body =
      selected.field === "email"
        ? { email: String(data.get("email") ?? "") }
        : {
            ...(mode === "reset" ? { password: String(data.get("password") ?? "") } : {}),
            token: String(data.get("token") ?? ""),
          };
    try {
      await postAuthenticatedMutation(selected.action, body);
      setSuccess(true);
    } catch (caught) {
      const code = caught instanceof AuthApiError ? caught.code : "service_unavailable";
      setError(
        code === "invalid_token"
          ? "Link tidak valid, kedaluwarsa, atau sudah digunakan."
          : code === "rate_limited"
            ? "Terlalu banyak percobaan. Tunggu sebelum mencoba lagi."
            : code === "invalid_body"
              ? "Periksa kembali data formulir."
              : "Layanan belum dapat memproses permintaan.",
      );
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-md border border-success bg-white p-6" role="status">
        <p className="font-semibold text-success">{selected.success}</p>
        <Link
          className="focus-ring mt-5 inline-flex min-h-12 items-center justify-center rounded-sm bg-lens px-5 py-3 font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-lens-strong"
          href="/login"
        >
          Kembali ke login
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {selected.field === "email" ? (
        <div>
          <Label htmlFor="recovery-email">Email</Label>
          <Input
            autoComplete="email"
            id="recovery-email"
            maxLength={320}
            name="email"
            required
            type="email"
          />
        </div>
      ) : (
        <input name="token" type="hidden" value={fragmentToken} />
      )}
      {mode === "reset" ? (
        <div>
          <Label htmlFor="recovery-password">Password baru</Label>
          <Input
            autoComplete="new-password"
            id="recovery-password"
            maxLength={128}
            minLength={12}
            name="password"
            required
            type="password"
          />
          <p className="mt-2 text-sm text-ink-muted">
            Minimal 12 karakter. Semua session lama akan dicabut.
          </p>
        </div>
      ) : null}
      {selected.field === "token" && !fragmentToken ? (
        <p
          className="rounded-md border border-aperture bg-white p-4 text-ink-muted"
          role="alert"
        >
          Link tidak memuat token.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-danger bg-danger-soft p-4 text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        className="w-full"
        disabled={pending || (selected.field === "token" && !fragmentToken)}
        type="submit"
      >
        {pending ? "Memproses…" : selected.button}
      </Button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import { Button, getButtonClassName } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type RecoveryMode = "forgot" | "request-verification" | "reset" | "verify";

const config = {
  forgot: {
    action: "/api/auth/forgot-password",
    button: "Kirim instruksi pengaturan ulang",
    field: "email",
    success: "Jika akun aktif tersedia, instruksi pengaturan ulang sudah disiapkan.",
  },
  "request-verification": {
    action: "/api/auth/request-verification",
    button: "Kirim instruksi verifikasi",
    field: "email",
    success: "Jika akun aktif belum terverifikasi, instruksi sudah disiapkan.",
  },
  reset: {
    action: "/api/auth/reset-password",
    button: "Simpan kata sandi baru",
    field: "token",
    success: "Kata sandi diperbarui. Semua sesi masuk lama sudah dinonaktifkan.",
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
          ? "Tautan tidak valid, kedaluwarsa, atau sudah digunakan."
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
      <div className="border-success/30 bg-success-soft rounded-[16px] border p-6" role="status">
        <p className="text-success font-medium">{selected.success}</p>
        <Link className={`${getButtonClassName("primary", "md")} mt-5`} href="/login">
          Kembali ke halaman masuk
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
          <Label htmlFor="recovery-password">Kata sandi baru</Label>
          <Input
            autoComplete="new-password"
            id="recovery-password"
            maxLength={128}
            minLength={12}
            name="password"
            required
            type="password"
          />
          <p className="text-ink-muted mt-2 text-sm">
            Minimal 12 karakter. Semua sesi masuk lama akan dinonaktifkan.
          </p>
        </div>
      ) : null}
      {selected.field === "token" && !fragmentToken ? (
        <p
          className="border-warning/30 bg-warning-soft text-warning rounded-[16px] border p-4"
          role="alert"
        >
          Tautan tidak memuat kode akses.
        </p>
      ) : null}
      {error ? (
        <p
          className="border-danger/30 bg-danger-soft text-danger rounded-[16px] border p-4"
          role="alert"
        >
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

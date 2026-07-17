"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";

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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6" role="status">
        <p className="font-semibold text-emerald-950">{selected.success}</p>
        <Link
          className="focus-ring mt-5 inline-flex rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white"
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
          <label className="block text-sm font-semibold" htmlFor="recovery-email">
            Email
          </label>
          <input
            autoComplete="email"
            className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] px-4"
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
          <label className="block text-sm font-semibold" htmlFor="recovery-password">
            Password baru
          </label>
          <input
            autoComplete="new-password"
            className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] px-4"
            id="recovery-password"
            maxLength={128}
            minLength={12}
            name="password"
            required
            type="password"
          />
          <p className="mt-2 text-sm text-[var(--muted)]">
            Minimal 12 karakter. Semua session lama akan dicabut.
          </p>
        </div>
      ) : null}
      {selected.field === "token" && !fragmentToken ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          role="alert"
        >
          Link tidak memuat token.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="focus-ring min-h-12 w-full rounded-xl bg-[var(--foreground)] px-5 py-3 font-semibold text-white disabled:opacity-50"
        disabled={pending || (selected.field === "token" && !fragmentToken)}
        type="submit"
      >
        {pending ? "Memproses…" : selected.button}
      </button>
    </form>
  );
}

"use client";

import { type FormEvent, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import { Input, Label } from "@/components/ui/input";

export function DeleteAccountForm({ provider }: { provider?: "google" }) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    if (provider === "google") {
      try {
        const result = await postAuthenticatedMutation<{ authorizationUrl: string }>(
          "/api/account/delete/google",
          { confirmation },
        );
        window.location.assign(result.authorizationUrl);
      } catch {
        setError("Verifikasi Google gagal dimulai. Akun belum diubah.");
        setIsPending(false);
      }
      return;
    }
    const formData = new FormData(event.currentTarget);

    try {
      await postAuthenticatedMutation("/api/account/delete", {
        confirmation,
        password: String(formData.get("password") ?? ""),
      });
      window.location.assign("/?account=deleted");
    } catch (caught) {
      const code = caught instanceof AuthApiError ? caught.code : "service_unavailable";
      setError(
        code === "invalid_credentials"
          ? "Kata sandi tidak cocok. Akun belum dihapus."
          : code === "rate_limited"
            ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."
            : "Penghapusan gagal. Akun belum diubah.",
      );
      setIsPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      {provider !== "google" ? (
        <div>
          <Label htmlFor="delete-password">Kata sandi saat ini</Label>
          <Input
            autoComplete="current-password"
            className="border-danger-soft hover:border-danger"
            id="delete-password"
            maxLength={128}
            minLength={12}
            name="password"
            required
            type="password"
          />
        </div>
      ) : null}
      <div>
        <Label htmlFor="delete-confirmation">
          Ketik <span className="font-mono">HAPUS AKUN</span>
        </Label>
        <Input
          autoComplete="off"
          className="border-danger-soft hover:border-danger"
          id="delete-confirmation"
          maxLength={10}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          spellCheck={false}
          value={confirmation}
        />
      </div>

      {error ? (
        <p
          className="border-danger-soft text-danger bg-surface rounded-[12px] border px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        className="focus-ring pressable bg-danger text-canvas hover:bg-danger/90 min-h-12 rounded-[12px] px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        disabled={confirmation !== "HAPUS AKUN" || isPending}
        type="submit"
      >
        {isPending
          ? "Memverifikasi…"
          : provider === "google"
            ? "Verifikasi Google dan hapus akun"
            : "Hapus akun permanen"}
      </button>
    </form>
  );
}

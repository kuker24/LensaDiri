"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";

export function DeleteAccountForm() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(event.currentTarget);

    try {
      await postAuthenticatedMutation("/api/account/delete", {
        confirmation,
        password: String(formData.get("password") ?? ""),
      });
      router.push("/?account=deleted");
      router.refresh();
    } catch (caught) {
      const code = caught instanceof AuthApiError ? caught.code : "service_unavailable";
      setError(
        code === "invalid_credentials"
          ? "Password tidak cocok. Akun belum dihapus."
          : code === "rate_limited"
            ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."
            : "Penghapusan gagal. Akun belum diubah.",
      );
      setIsPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-semibold" htmlFor="delete-password">
          Password saat ini
        </label>
        <input
          autoComplete="current-password"
          className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-base transition outline-none hover:border-red-400"
          id="delete-password"
          maxLength={128}
          minLength={12}
          name="password"
          required
          type="password"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor="delete-confirmation">
          Ketik <span className="font-mono">HAPUS AKUN</span>
        </label>
        <input
          autoComplete="off"
          className="focus-ring mt-2 min-h-12 w-full rounded-xl border border-red-200 bg-white px-4 text-base transition outline-none hover:border-red-400"
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
          className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-900"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        className="focus-ring min-h-12 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={confirmation !== "HAPUS AKUN" || isPending}
        type="submit"
      >
        {isPending ? "Menghapus permanen…" : "Hapus akun permanen"}
      </button>
    </form>
  );
}

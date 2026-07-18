"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import { Input, Label } from "@/components/ui/input";

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
        <Label htmlFor="delete-password">Password saat ini</Label>
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
          className="border-danger-soft text-danger rounded-md border bg-white/90 px-4 py-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        className="focus-ring bg-danger text-canvas hover:bg-danger/90 min-h-12 rounded-md px-5 py-3 font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50"
        disabled={confirmation !== "HAPUS AKUN" || isPending}
        type="submit"
      >
        {isPending ? "Menghapus permanen…" : "Hapus akun permanen"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { postAuthenticatedMutation } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    setFailed(false);
    setIsPending(true);
    try {
      await postAuthenticatedMutation("/api/auth/logout");
      router.push("/");
      router.refresh();
    } catch {
      setFailed(true);
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        className="focus-ring min-h-11 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-60"
        disabled={isPending}
        onClick={logout}
        type="button"
      >
        {isPending ? "Keluar…" : "Keluar"}
      </button>
      {failed ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          Gagal keluar. Coba lagi.
        </p>
      ) : null}
    </div>
  );
}

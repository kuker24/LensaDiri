"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { postAuthenticatedMutation } from "@/lib/auth/client";

export function DashboardOpenButton({
  id,
  kind,
}: {
  id: string;
  kind: "result" | "session";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setPending(true);
    setError(null);
    try {
      const data = await postAuthenticatedMutation<{ href: string }>("/api/dashboard/open", {
        id,
        kind,
      });
      router.push(data.href);
    } catch {
      setError(kind === "session" ? "Sesi tidak dapat dilanjutkan." : "Hasil tidak dapat dibuka.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="focus-ring min-h-11 rounded-xl border border-[var(--line)] px-4 font-semibold hover:border-violet-300 hover:text-violet-700 disabled:opacity-50"
        disabled={pending}
        onClick={open}
        type="button"
      >
        {pending ? "Membuka…" : kind === "session" ? "Lanjutkan" : "Buka dan kelola"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-800" role="alert">{error}</p> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { postAuthenticatedMutation } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function DashboardOpenButton({ id, kind }: { id: string; kind: "result" | "session" }) {
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
      <Button disabled={pending} onClick={open} type="button" variant="secondary">
        {pending ? "Membuka…" : kind === "session" ? "Lanjutkan" : "Buka dan kelola"}
      </Button>
      {error ? (
        <p className="text-danger mt-2 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

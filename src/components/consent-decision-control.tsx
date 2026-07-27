"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { postAuthenticatedMutation } from "@/lib/auth/client";
import type { ConsentType } from "@/server/repositories/consents";

const decisionLabels = {
  accepted: "Diizinkan",
  not_set: "Belum dipilih",
  rejected: "Ditolak",
} as const;

export function ConsentDecisionControl({
  consentType,
  decision,
  version,
}: {
  consentType: ConsentType;
  decision: "accepted" | "not_set" | "rejected";
  version: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function record(accepted: boolean) {
    setPending(true);
    setError(null);
    try {
      await postAuthenticatedMutation("/api/account/consent", {
        accepted,
        consentType,
        version,
      });
      router.refresh();
    } catch {
      setError("Keputusan persetujuan belum tersimpan.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold" aria-live="polite">
        Status: {decisionLabels[decision]}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          aria-pressed={decision === "accepted"}
          className="focus-ring decision-tile border-line aria-pressed:border-lens aria-pressed:bg-lens-soft min-h-11 rounded-[12px] border px-4 font-semibold"
          disabled={pending}
          onClick={() => record(true)}
          type="button"
        >
          Izinkan
        </button>
        <button
          aria-pressed={decision === "rejected"}
          className="focus-ring decision-tile border-line aria-pressed:border-lens aria-pressed:bg-lens-soft min-h-11 rounded-[12px] border px-4 font-semibold"
          disabled={pending}
          onClick={() => record(false)}
          type="button"
        >
          Tolak atau cabut
        </button>
      </div>
      {error ? (
        <p className="text-danger mt-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

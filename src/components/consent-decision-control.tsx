"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { postAuthenticatedMutation } from "@/lib/auth/client";
import type { ConsentType } from "@/server/repositories/consents";

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
      setError("Keputusan consent belum tersimpan.");
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-semibold capitalize" aria-live="polite">
        Status: {decision.replaceAll("_", " ")}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          aria-pressed={decision === "accepted"}
          className="focus-ring min-h-11 rounded-xl border border-[var(--line)] px-4 font-semibold aria-pressed:border-violet-700 aria-pressed:bg-violet-50"
          disabled={pending}
          onClick={() => record(true)}
          type="button"
        >
          Izinkan
        </button>
        <button
          aria-pressed={decision === "rejected"}
          className="focus-ring min-h-11 rounded-xl border border-[var(--line)] px-4 font-semibold aria-pressed:border-violet-700 aria-pressed:bg-violet-50"
          disabled={pending}
          onClick={() => record(false)}
          type="button"
        >
          Tolak atau cabut
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

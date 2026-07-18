"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { startAssessment } from "@/lib/assessment/client";
import type { AssessmentMode } from "@/server/repositories/assessment";
import { Button } from "@/components/ui/button";

export function StartAssessmentForm({ mode }: { mode: AssessmentMode }) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  async function start() {
    setError(false);
    setPending(true);
    try {
      const token = await startAssessment(mode);
      router.push(`/test/${token}`);
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div>
      <label className="flex items-start gap-3 rounded-md border border-line bg-lens-soft/40 p-4 text-sm leading-6">
        <input
          className="focus-ring mt-1 h-5 w-5 accent-lens"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
        />
        <span>
          Aku setuju jawabanku diproses untuk menghasilkan refleksi pribadi. Hasil bukan diagnosis
          dan tetap private sampai aku memilih berbagi.
        </span>
      </label>
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          Gagal memulai. Coba lagi.
        </p>
      ) : null}
      <Button className="mt-5 w-full" disabled={!consent || pending} onClick={start} type="button">
        {pending ? "Menyiapkan…" : `Mulai ${mode === "quick" ? "Quick" : "Standard"}`}
      </Button>
    </div>
  );
}

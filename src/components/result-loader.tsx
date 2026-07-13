"use client";
import { useEffect, useState } from "react";
import { getPrivateResult, getSharedResult } from "@/lib/assessment/client";
import { ResultReport } from "@/components/result-report";
import type { ResultView } from "@/server/repositories/assessment";
export function ResultLoader({ shared, token }: { shared?: boolean; token: string }) {
  const [result, setResult] = useState<ResultView | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    (shared ? getSharedResult(token) : getPrivateResult(token))
      .then(setResult)
      .catch(() => setFailed(true));
  }, [shared, token]);
  if (failed)
    return (
      <p className="py-20 text-center text-red-800" role="alert">
        Hasil tidak ditemukan, kedaluwarsa, atau sudah dicabut.
      </p>
    );
  if (!result) return <p className="py-20 text-center text-[var(--muted)]">Memuat hasil…</p>;
  return <ResultReport result={result} />;
}

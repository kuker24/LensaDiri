"use client";

import { useEffect, useState } from "react";

import { ResultReport } from "@/components/result-report";
import { SharedResultReport } from "@/components/shared-result-report";
import { getPrivateResult, getSharedResult } from "@/lib/assessment/client";
import type { PrivateResultView } from "@/server/repositories/assessment";
import type { SafeSharedResultView } from "@/server/repositories/result-views";

function PrivateResultLoader({ token }: { token: string }) {
  const [result, setResult] = useState<PrivateResultView | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPrivateResult(token)
      .then(setResult)
      .catch(() => setFailed(true));
  }, [token]);

  if (failed)
    return (
      <p className="py-20 text-center text-red-800" role="alert">
        Hasil tidak ditemukan atau sudah dihapus.
      </p>
    );
  if (!result) return <p className="py-20 text-center text-[var(--muted)]">Memuat hasil…</p>;
  return <ResultReport result={result} />;
}

function SharedResultLoader({ token }: { token: string }) {
  const [result, setResult] = useState<SafeSharedResultView | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getSharedResult(token)
      .then(setResult)
      .catch(() => setFailed(true));
  }, [token]);

  if (failed)
    return (
      <p className="py-20 text-center text-red-800" role="alert">
        Hasil tidak ditemukan, kedaluwarsa, atau sudah dicabut.
      </p>
    );
  if (!result) return <p className="py-20 text-center text-[var(--muted)]">Memuat hasil…</p>;
  return <SharedResultReport result={result} />;
}

export function ResultLoader({ shared, token }: { shared?: boolean; token: string }) {
  return shared ? <SharedResultLoader token={token} /> : <PrivateResultLoader token={token} />;
}

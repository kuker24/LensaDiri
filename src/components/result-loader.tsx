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
      <div className="py-20 text-center" role="alert">
        <h1 className="font-display text-danger text-2xl font-semibold">Hasil tidak ditemukan</h1>
        <p className="text-ink-muted mt-3">
          Hasil mungkin sudah dihapus atau tautannya tidak valid.
        </p>
      </div>
    );
  if (!result)
    return (
      <div className="py-20 text-center" role="status">
        <h1 className="font-display text-2xl font-semibold">Memuat hasil pribadi</h1>
        <p className="text-ink-muted mt-3">Menyiapkan ringkasan reflektifmu…</p>
      </div>
    );
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
      <div className="py-20 text-center" role="alert">
        <h1 className="font-display text-danger text-2xl font-semibold">Hasil tidak ditemukan</h1>
        <p className="text-ink-muted mt-3">
          Tautan mungkin kedaluwarsa, sudah dicabut, atau tidak valid.
        </p>
      </div>
    );
  if (!result)
    return (
      <div className="py-20 text-center" role="status">
        <h1 className="font-display text-2xl font-semibold">Memuat hasil yang dibagikan</h1>
        <p className="text-ink-muted mt-3">Menyiapkan tampilan aman tanpa diagnostik pribadi…</p>
      </div>
    );
  return <SharedResultReport result={result} />;
}

export function ResultLoader({ shared, token }: { shared?: boolean; token: string }) {
  return shared ? <SharedResultLoader token={token} /> : <PrivateResultLoader token={token} />;
}

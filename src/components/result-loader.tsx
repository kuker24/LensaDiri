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
      <div
        className="border-danger-soft shadow-surface mx-auto my-10 max-w-xl rounded-xl border bg-white/90 p-8 text-center"
        role="alert"
      >
        <p className="text-danger text-sm font-semibold">Hasil pribadi</p>
        <h1 className="font-display mt-2 text-2xl font-semibold">Hasil tidak ditemukan</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Hasil mungkin sudah dihapus atau tautannya tidak valid.
        </p>
      </div>
    );
  if (!result)
    return (
      <div
        className="border-line shadow-surface mx-auto my-10 max-w-xl rounded-xl border bg-white/90 p-8 text-center"
        role="status"
      >
        <span
          aria-hidden="true"
          className="bg-lens-soft mx-auto block h-1.5 w-24 overflow-hidden rounded-full"
        >
          <span className="bg-lens block h-full w-1/2 rounded-full" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold">Memuat hasil pribadi</h1>
        <p className="text-ink-muted mt-3 leading-7">Menyiapkan ringkasan reflektifmu…</p>
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
      <div
        className="border-danger-soft shadow-surface mx-auto my-10 max-w-xl rounded-xl border bg-white/90 p-8 text-center"
        role="alert"
      >
        <p className="text-danger text-sm font-semibold">Link berbagi</p>
        <h1 className="font-display mt-2 text-2xl font-semibold">Hasil tidak ditemukan</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Tautan mungkin kedaluwarsa, sudah dicabut, atau tidak valid.
        </p>
      </div>
    );
  if (!result)
    return (
      <div
        className="border-line shadow-surface mx-auto my-10 max-w-xl rounded-xl border bg-white/90 p-8 text-center"
        role="status"
      >
        <span
          aria-hidden="true"
          className="bg-lens-soft mx-auto block h-1.5 w-24 overflow-hidden rounded-full"
        >
          <span className="bg-lens block h-full w-1/2 rounded-full" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold">Memuat hasil yang dibagikan</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Menyiapkan tampilan aman tanpa diagnostik pribadi…
        </p>
      </div>
    );
  return <SharedResultReport result={result} />;
}

export function ResultLoader({ shared, token }: { shared?: boolean; token: string }) {
  return shared ? <SharedResultLoader token={token} /> : <PrivateResultLoader token={token} />;
}

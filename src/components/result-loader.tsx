"use client";

import { useEffect, useState, type ReactNode } from "react";

import { ResultReport } from "@/components/result-report";
import { SharedResultReport } from "@/components/shared-result-report";
import { getPrivateResult, getSharedResult } from "@/lib/assessment/client";
import type { PrivateResultView } from "@/server/repositories/assessment";
import type { SafeSharedResultView } from "@/server/repositories/result-views";

function PrivateResultLoader({ children, token }: { children?: ReactNode; token: string }) {
  const [result, setResult] = useState<PrivateResultView | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getPrivateResult(token)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (failed)
    return (
      <div
        className="border-danger/30 bg-danger-soft mx-auto my-10 max-w-xl rounded-[1.2rem] border p-8 text-center"
        role="alert"
      >
        <p className="text-danger text-sm font-semibold">Hasil pribadi</p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.025em]">Hasil tidak ditemukan</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Hasil mungkin sudah dihapus atau tautannya tidak valid.
        </p>
      </div>
    );
  if (!result)
    return (
      <div
        className="border-line bg-surface mx-auto my-10 max-w-xl rounded-[1.2rem] border p-8 text-center"
        role="status"
      >
        <span
          aria-hidden="true"
          className="bg-lens-soft mx-auto block h-1.5 w-24 overflow-hidden rounded-full"
        >
          <span className="bg-lens block h-full w-1/2 rounded-full" />
        </span>
        <h1 className="mt-5 text-2xl font-medium tracking-[-0.025em]">Memuat hasil pribadi</h1>
        <p className="text-ink-muted mt-3 leading-7">Menyiapkan ringkasan reflektifmu…</p>
      </div>
    );
  return (
    <>
      <ResultReport result={result} />
      {children}
    </>
  );
}

function SharedResultLoader({ token }: { token: string }) {
  const [result, setResult] = useState<SafeSharedResultView | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getSharedResult(token)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (failed)
    return (
      <div
        className="border-danger/30 bg-danger-soft mx-auto my-10 max-w-xl rounded-[1.2rem] border p-8 text-center"
        role="alert"
      >
        <p className="text-danger text-sm font-semibold">Link berbagi</p>
        <h1 className="mt-3 text-2xl font-medium tracking-[-0.025em]">Hasil tidak ditemukan</h1>
        <p className="text-ink-muted mt-3 leading-7">
          Tautan mungkin kedaluwarsa, sudah dicabut, atau tidak valid.
        </p>
      </div>
    );
  if (!result)
    return (
      <div
        className="border-line bg-surface mx-auto my-10 max-w-xl rounded-[1.2rem] border p-8 text-center"
        role="status"
      >
        <span
          aria-hidden="true"
          className="bg-lens-soft mx-auto block h-1.5 w-24 overflow-hidden rounded-full"
        >
          <span className="bg-lens block h-full w-1/2 rounded-full" />
        </span>
        <h1 className="mt-5 text-2xl font-medium tracking-[-0.025em]">
          Memuat hasil yang dibagikan
        </h1>
        <p className="text-ink-muted mt-3 leading-7">
          Menyiapkan tampilan aman tanpa diagnostik pribadi…
        </p>
      </div>
    );
  return <SharedResultReport result={result} />;
}

export function ResultLoader({
  children,
  shared,
  token,
}: {
  children?: ReactNode;
  shared?: boolean;
  token: string;
}) {
  return shared ? (
    <SharedResultLoader key={token} token={token} />
  ) : (
    <PrivateResultLoader key={token} token={token}>
      {children}
    </PrivateResultLoader>
  );
}

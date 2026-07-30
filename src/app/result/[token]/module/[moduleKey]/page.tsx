import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getPrivateResultByToken } from "@/server/services/assessment";
import { getButtonClassName } from "@/components/ui/button";
import { ResultScoreIndicator } from "@/components/result-score-indicator";
import {
  formatModuleResultTitle,
  formatResultKey,
  orderResultScores,
  resultModuleLabels,
} from "@/lib/report/result-presentation";

export default async function ResultModuleDetailPage({
  params,
}: {
  params: Promise<{ token: string; moduleKey: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { token, moduleKey } = await params;
  const moduleName = resultModuleLabels[moduleKey] ?? "Lensa reflektif";

  const result = await getPrivateResultByToken(token);
  if (!result) {
    return notFound();
  }

  const moduleResult =
    result.kind === "modular"
      ? result.modules.find((candidate) => candidate.moduleKey === moduleKey)
      : moduleKey === "trait_profile"
        ? null
        : undefined;
  if (moduleResult === undefined) return notFound();

  return (
    <div className="task-shell">
      <nav
        aria-label="Jejak navigasi"
        className="text-ink-muted mb-6 font-mono text-xs tracking-[-0.02em]"
      >
        <Link
          className="focus-ring quiet-link rounded-[12px]"
          href="/dashboard/results"
          prefetch={false}
        >
          Hasil
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <Link className="focus-ring quiet-link rounded-[12px]" href={`/result/${token}`}>
          Hasil #{token.slice(0, 8)}
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>{moduleName}</span>
      </nav>

      <h1 className="text-3xl font-normal tracking-[-0.03em]">Detail lensa: {moduleName}</h1>

      {moduleResult ? (
        <p className="mt-3 text-xl font-medium">
          {formatModuleResultTitle(moduleResult.moduleKey, moduleResult.summary)}
        </p>
      ) : null}
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Posisi setiap aspek menunjukkan kecenderungan jawabanmu, bukan persentase akurasi.
      </p>

      <div className="border-line bg-surface rounded-[16px] border p-6">
        <h2 className="text-lg font-normal">Ringkasan skor</h2>
        {moduleResult ? (
          <div className="mt-5 space-y-6">
            {orderResultScores(moduleResult.moduleKey, moduleResult.scores).map((score) => (
              <ResultScoreIndicator
                constructKey={score.constructKey}
                key={`${score.constructKey}-${score.facetKey}`}
                label={formatResultKey(score.constructKey)}
                value={score.normalizedScore}
              />
            ))}
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {result.kind === "legacy" &&
              result.scores.map((score) => (
                <li className="flex justify-between gap-4 text-sm" key={score.constructKey}>
                  <span>{formatResultKey(score.constructKey)}</span>
                  <strong>{Math.round(score.normalizedScore)} dari 100</strong>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <Link className={getButtonClassName("secondary", "md")} href={`/result/${token}`}>
          Kembali
        </Link>
      </div>
    </div>
  );
}

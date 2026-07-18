import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getPrivateResultByToken } from "@/server/services/assessment";
import { Button } from "@/components/ui/button";

export default async function ResultModuleDetailPage({
  params,
}: {
  params: Promise<{ token: string; moduleKey: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { token, moduleKey } = await params;

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
    <main className="container-shell py-12">
      <nav aria-label="Breadcrumb" className="text-ink-muted mb-6 text-sm">
        <Link className="hover:text-ink underline" href="/dashboard/results">
          Hasil
        </Link>
        <span className="mx-2">/</span>
        <Link className="hover:text-ink underline" href={`/result/${token}`}>
          Hasil #{token.slice(0, 8)}
        </Link>
        <span className="mx-2">/</span>
        <span>{moduleKey.replaceAll("_", " ")}</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold capitalize">
        Detail Modul: {moduleKey.replaceAll("_", " ")}
      </h1>

      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Skor dan interpretasi per construct untuk lensa ini.
      </p>

      <div className="border-line rounded-lg border bg-white/90 p-6">
        <h2 className="text-lg font-semibold">Ringkasan Skor</h2>
        {moduleResult ? (
          <ul className="mt-4 space-y-3">
            {moduleResult.scores.map((score) => (
              <li
                className="flex justify-between gap-4 text-sm"
                key={`${score.constructKey}-${score.facetKey}`}
              >
                <span className="capitalize">{score.constructKey.replaceAll("_", " ")}</span>
                <strong>{score.normalizedScore.toFixed(1)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-4 space-y-3">
            {result.kind === "legacy" &&
              result.scores.map((score) => (
                <li className="flex justify-between gap-4 text-sm" key={score.constructKey}>
                  <span className="capitalize">{score.constructKey.replaceAll("_", " ")}</span>
                  <strong>{score.normalizedScore.toFixed(1)}</strong>
                </li>
              ))}
          </ul>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <Link href={`/result/${token}`}>
          <Button variant="secondary">Kembali</Button>
        </Link>
      </div>
    </main>
  );
}

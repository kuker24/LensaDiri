import type { ResultView } from "@/server/repositories/assessment";

const labels: Record<string, string> = {
  openness: "Keterbukaan",
  conscientiousness: "Keteraturan",
  extraversion: "Energi sosial",
  agreeableness: "Kooperasi",
  emotional_sensitivity: "Kepekaan emosi",
};

export function ResultReport({ result }: { result: ResultView }) {
  return (
    <div>
      <div className="rounded-3xl bg-[var(--foreground)] p-7 text-white sm:p-10">
        <p className="text-sm font-semibold text-[var(--aqua)]">Profil reflektifmu</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {result.summary.archetype}
        </h1>
        <p className="mt-5 max-w-2xl leading-7 text-indigo-100">{result.summary.disclaimer}</p>
      </div>
      <section className="mt-8" aria-labelledby="trait-heading">
        <h2 className="text-2xl font-semibold" id="trait-heading">
          Lima spektrum
        </h2>
        <div className="mt-5 space-y-5">
          {result.scores.map((score) => (
            <div
              className="rounded-2xl border border-[var(--line)] bg-white p-5"
              key={score.constructKey}
            >
              <div className="flex justify-between gap-4">
                <h3 className="font-semibold">{labels[score.constructKey]}</h3>
                <span className="font-semibold">{score.normalizedScore}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full bg-violet-700"
                  style={{ width: `${score.normalizedScore}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Confidence {Math.round(score.confidence * 100)}%
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8" aria-labelledby="overlay-heading">
        <h2 className="text-2xl font-semibold" id="overlay-heading">
          Lensa reflektif
        </h2>
        <div className="mt-5 flex flex-wrap gap-4">
          {Object.entries(result.summary.overlays).map(([key, overlay]) => (
            <article
              className="min-w-[min(100%,16rem)] flex-1 rounded-2xl border border-[var(--line)] bg-violet-50 p-5"
              key={key}
            >
              <p className="text-lg font-semibold">{overlay.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{overlay.note}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold">Pola yang menonjol</h2>
          <ul className="mt-4 space-y-3 leading-7 text-[var(--muted)]">
            {result.summary.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="text-xl font-semibold">Arah pengembangan</h2>
          <ul className="mt-4 space-y-3 leading-7 text-[var(--muted)]">
            {result.summary.growthFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      {result.quality.straightLineWarning ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          Semua respons memakai nilai sama. Baca hasil dengan confidence lebih hati-hati.
        </p>
      ) : null}
    </div>
  );
}

import type { SafeSharedResultView } from "@/server/repositories/result-views";

const correlationLabels: Readonly<Record<string, string>> = {
  complementary: "Pola saling melengkapi",
  context_dependent: "Bergantung konteks",
  low_confidence_conflict: "Perlu dibaca hati-hati",
  reflective_tension: "Tegangan reflektif",
  reinforcing: "Pola saling menguatkan",
};

const narrativeLabels: Readonly<Record<string, string>> = {
  "correlation.expression.aligned":
    "Preferensi interaksi dan gaya ekspresi terlihat saling menguatkan.",
  "correlation.expression.safe_context":
    "Gaya ekspresi dapat berubah sesuai rasa aman dan konteks sosial.",
  "correlation.mixed_confidence.caution":
    "Hasil tiap lensa perlu dibaca sebagai refleksi yang saling melengkapi.",
  "correlation.readiness.context_balance":
    "Dorongan bersiap dan kepekaan emosional memberi konteks yang saling melengkapi.",
  "correlation.readiness.sensitivity_aligned":
    "Kepekaan dan kesiapsiagaan terlihat bergerak bersama dalam respons yang dibagikan.",
  "correlation.social_energy.aligned":
    "Cara energi sosial tergambar selaras di lensa yang dibagikan.",
  "correlation.social_energy.context_tension":
    "Energi sosial dapat terlihat berbeda menurut konteks, bukan kontradiksi mutlak.",
};

export function SharedResultReport({ result }: { result: SafeSharedResultView }) {
  if (result.kind === "legacy") {
    return (
      <div>
        <header className="lens-glow bg-lens-strong text-canvas relative overflow-hidden rounded-lg p-7 sm:p-10">
          <p className="text-aperture-on-dark text-sm font-semibold">
            Ringkasan hasil yang dibagikan
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            {result.title}
          </h1>
          <p className="text-canvas/85 mt-5 max-w-2xl leading-7">{result.disclaimer}</p>
        </header>
        <section className="mt-8" aria-labelledby="shared-trait-heading">
          <h2 className="font-display text-2xl font-semibold" id="shared-trait-heading">
            Lima spektrum
          </h2>
          <div className="mt-5 space-y-5">
            {result.scores.map((score) => (
              <article
                className="border-line rounded-md border bg-white p-5"
                key={score.constructKey}
              >
                <div className="flex justify-between gap-4">
                  <h3 className="font-semibold">{score.label}</h3>
                  <span className="font-semibold tabular-nums">{score.normalizedScore}</span>
                </div>
                <div className="bg-line mt-3 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-lens h-full rounded-full"
                    style={{ width: `${score.normalizedScore}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <article className="border-line rounded-lg border bg-white p-6">
            <h2 className="font-display text-xl font-semibold">Pola yang dibagikan</h2>
            <ul className="text-ink-muted mt-4 space-y-3 leading-7">
              {result.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="border-line rounded-lg border bg-white p-6">
            <h2 className="font-display text-xl font-semibold">Arah pengembangan</h2>
            <ul className="text-ink-muted mt-4 space-y-3 leading-7">
              {result.growthFocus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div>
      <header className="lens-glow bg-lens-strong text-canvas relative overflow-hidden rounded-lg p-7 sm:p-10">
        <p className="text-aperture-on-dark text-sm font-semibold">
          Ringkasan hasil yang dibagikan
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {result.title}
        </h1>
        <p className="text-canvas/85 mt-5 max-w-2xl leading-7">{result.disclaimer}</p>
      </header>
      <div className="mt-8 space-y-8">
        {result.modules.map((module) => (
          <section
            aria-labelledby={`shared-module-${module.key}`}
            className="border-line rounded-lg border bg-white p-6"
            key={module.key}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2
                className="font-display text-2xl font-semibold"
                id={`shared-module-${module.key}`}
              >
                {module.name}
              </h2>
              <span className="border-lens-soft bg-lens-soft text-lens-strong rounded-sm border px-3 py-1 text-sm font-semibold">
                Evidence {module.evidenceTier.replace("_", " ")}
              </span>
            </div>
            <p className="text-ink-muted mt-3">{module.title}</p>
            <p className="text-ink-muted mt-2 text-sm leading-6">{module.disclaimer}</p>
            <div className="mt-5 space-y-5">
              {module.scores.map((score) => (
                <article key={`${score.constructKey}-${score.facetKey}`}>
                  <div className="flex justify-between gap-4">
                    <h3 className="font-semibold">{score.label}</h3>
                    <span className="font-semibold tabular-nums">{score.normalizedScore}</span>
                  </div>
                  <div className="bg-line mt-3 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-lens h-full rounded-full"
                      style={{ width: `${score.normalizedScore}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {result.correlations.length > 0 ? (
        <section className="mt-8" aria-labelledby="shared-correlation-heading">
          <h2 className="font-display text-2xl font-semibold" id="shared-correlation-heading">
            Hubungan antar-lensa
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.correlations.map((correlation) => (
              <article
                className="border-line bg-lens-soft/40 rounded-md border p-5"
                key={`${correlation.kind}-${correlation.narrativeKey}`}
              >
                <h3 className="font-semibold">
                  {correlationLabels[correlation.kind] ?? "Konteks antar-lensa"}
                </h3>
                <p className="text-ink-muted mt-2 text-sm leading-6">
                  {narrativeLabels[correlation.narrativeKey] ??
                    "Lensa yang dibagikan memberi konteks tambahan untuk dibaca sebagai refleksi."}
                </p>
                <p className="text-lens-strong mt-3 text-xs font-semibold tabular-nums">
                  {correlation.sourceModules.map((module) => module.name).join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

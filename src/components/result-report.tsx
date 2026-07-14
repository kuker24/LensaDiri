import type { ResultView } from "@/server/repositories/assessment";

const labels: Record<string, string> = {
  openness: "Keterbukaan",
  conscientiousness: "Keteraturan",
  extraversion: "Energi sosial",
  agreeableness: "Kooperasi",
  emotional_sensitivity: "Kepekaan emosi",
  type_16: "16-Type",
  trait_profile: "Profil Trait",
  enneagram: "Enneagram",
  temperament: "Temperament",
  intuition: "Pola dan kemungkinan",
  feeling: "Pertimbangan manusia",
  judging: "Struktur keputusan",
  sanguine: "Ekspresif",
  choleric: "Penggerak",
  melancholic: "Mendalam",
  phlegmatic: "Stabil",
  reinforcing: "Pola saling menguatkan",
  complementary: "Pola saling melengkapi",
  reflective_tension: "Tegangan reflektif",
  context_dependent: "Bergantung konteks",
  low_confidence_conflict: "Perlu dibaca hati-hati",
  too_fast: "respons sangat cepat",
  straightlining: "pola jawaban seragam",
  low_variance: "variasi respons rendah",
  reverse_inconsistency: "pasangan respons kurang konsisten",
  threshold_ambiguity: "skor dekat batas",
  clarifier_recommended: "clarifier direkomendasikan",
  clarifier_skipped: "clarifier dilewati",
  weakest_module_low_confidence: "satu lensa memiliki confidence rendah",
  mixed_evidence_tiers: "tier bukti beragam",
};

const narrativeLabels: Record<string, string> = {
  "correlation.social_energy.aligned":
    "Cara kamu menggambarkan energi sosial terlihat selaras di dua lensa.",
  "correlation.social_energy.context_tension":
    "Energi sosial tampak berbeda antar-lensa. Perbedaan ini dapat menunjukkan pengaruh konteks, bukan kontradiksi mutlak.",
  "correlation.expression.aligned":
    "Preferensi interaksi dan gaya ekspresi terlihat saling menguatkan.",
  "correlation.expression.safe_context":
    "Gaya ekspresi dapat berubah sesuai rasa aman dan konteks sosial.",
  "correlation.readiness.sensitivity_aligned":
    "Kepekaan dan kesiapsiagaan terlihat bergerak bersama dalam responsmu.",
  "correlation.readiness.context_balance":
    "Dorongan bersiap dan kepekaan emosional memberi konteks yang saling melengkapi.",
  "correlation.mixed_confidence.caution":
    "Confidence antar-lensa belum merata. Utamakan lensa dengan confidence lebih kuat.",
};

function formatKey(value: string): string {
  return labels[value] ?? value.replaceAll("_", " ");
}

function ModularResultReport({ result }: { result: Extract<ResultView, { kind: "modular" }> }) {
  return (
    <div>
      <div className="rounded-3xl bg-[var(--foreground)] p-7 text-white sm:p-10">
        <p className="text-sm font-semibold text-[var(--aqua)]">Hasil modularmu</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {result.modules.length} lensa reflektif
        </h1>
        <p className="mt-5 max-w-2xl leading-7 text-indigo-100">{result.summary.disclaimer}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
            Confidence keseluruhan {Math.round(result.quality.confidence * 100)}%
          </span>
          <span className="text-sm text-indigo-200">Skor primer server-side · private</span>
        </div>
      </div>
      <div className="mt-8 space-y-8">
        {result.modules.map((module) => (
          <section
            aria-labelledby={`module-${module.moduleKey}`}
            className="rounded-2xl border border-[var(--line)] bg-white p-6"
            key={module.moduleKey}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-2xl font-semibold capitalize" id={`module-${module.moduleKey}`}>
                {formatKey(module.moduleKey)}
              </h2>
              <span className="text-sm text-[var(--muted)]">
                Confidence {Math.round(module.confidence * 100)}%
              </span>
            </div>
            <div className="mt-5 space-y-5">
              {module.scores.map((score) => (
                <div key={`${score.constructKey}-${score.facetKey}`}>
                  <div className="flex justify-between gap-4">
                    <h3 className="font-semibold capitalize">{formatKey(score.constructKey)}</h3>
                    <span className="font-semibold">{score.normalizedScore}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                    <div
                      className="h-full bg-violet-700"
                      style={{ width: `${score.normalizedScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-5 text-sm">
              <span className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-900">
                Evidence {module.evidenceTier.replace("_", " ")}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">
                Completion {Math.round(module.quality.completion * 100)}%
              </span>
            </div>
            {module.quality.flags.length > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p className="font-semibold">Catatan kualitas</p>
                <p className="mt-1">{module.quality.flags.map(formatKey).join(", ")}.</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">Tidak ada quality warning utama.</p>
            )}
          </section>
        ))}
      </div>
      {result.correlations.length > 0 ? (
        <section className="mt-8" aria-labelledby="correlation-heading">
          <h2 className="text-2xl font-semibold" id="correlation-heading">
            Hubungan antar-lensa
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.correlations.map((correlation) => (
              <article
                className="rounded-2xl border border-[var(--line)] bg-violet-50 p-5"
                key={correlation.ruleKey}
              >
                <h3 className="font-semibold capitalize">{formatKey(correlation.kind)}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {narrativeLabels[correlation.narrativeKey] ??
                    "Dua lensa memberi konteks tambahan yang perlu dibaca sebagai refleksi."}
                </p>
                <p className="mt-3 text-xs font-semibold text-violet-800">
                  {correlation.sourceModuleKeys.map(formatKey).join(" · ")} · Confidence{" "}
                  {Math.round(correlation.confidence * 100)}%
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function ResultReport({ result }: { result: ResultView }) {
  if (result.kind === "modular") return <ModularResultReport result={result} />;

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

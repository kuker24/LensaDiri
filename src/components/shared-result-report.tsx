import type { SafeSharedResultView } from "@/server/repositories/result-views";
import { ResultIdentitySummary } from "@/components/result-identity-summary";
import { ResultScoreIndicator } from "@/components/result-score-indicator";
import { orderResultScores, resultEvidenceLabels } from "@/lib/report/result-presentation";

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
        <header className="lens-glow bg-surface relative overflow-hidden rounded-[20px] border border-white/14 p-7 sm:p-10">
          <p className="mono-label text-ink">Ringkasan hasil yang dibagikan</p>
          <h1 className="mt-4 text-3xl font-normal tracking-[-0.035em] sm:text-5xl">
            {result.title}
          </h1>
          <ResultIdentitySummary
            items={[
              { name: "Profil Trait", title: result.title },
              ...result.overlays.map((overlay) => ({
                name: overlay.title,
                title: overlay.label,
              })),
            ]}
          />
          <p className="text-ink-muted mt-5 max-w-2xl leading-7">{result.disclaimer}</p>
        </header>
        <section className="mt-10" aria-labelledby="shared-trait-heading">
          <h2 className="text-2xl font-normal tracking-[-0.025em]" id="shared-trait-heading">
            Lima spektrum
          </h2>
          <div className="mt-5 space-y-4">
            {result.scores.map((score) => (
              <article
                className="border-line bg-surface rounded-[16px] border p-5"
                key={score.constructKey}
              >
                <ResultScoreIndicator
                  constructKey={score.constructKey}
                  label={score.label}
                  value={score.normalizedScore}
                />
              </article>
            ))}
          </div>
        </section>
        <section className="mt-10" aria-labelledby="shared-overlay-heading">
          <h2 className="text-2xl font-normal tracking-[-0.025em]" id="shared-overlay-heading">
            Lensa reflektif yang dibagikan
          </h2>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            Bagian ini dipertahankan agar hasil lama tetap dapat dibaca.
          </p>
          <div className="mt-5 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-3">
            {result.overlays.map((overlay) => (
              <article className="bg-surface p-5" key={overlay.title}>
                <p className="mono-label text-ink">{overlay.title}</p>
                <h3 className="mt-3 text-lg font-normal">{overlay.label}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-6">{overlay.note}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-10 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-2">
          <article className="bg-surface p-6">
            <h2 className="text-xl font-normal tracking-[-0.02em]">Pola yang dibagikan</h2>
            <ul className="text-ink-muted mt-4 space-y-3 leading-7">
              {result.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="bg-surface p-6">
            <h2 className="text-xl font-normal tracking-[-0.02em]">Arah pengembangan</h2>
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
      <header className="lens-glow bg-surface relative overflow-hidden rounded-[20px] border border-white/18 p-7 sm:p-10">
        <p className="mono-label text-ink">Ringkasan hasil yang dibagikan</p>
        <h1 className="mt-4 text-3xl font-normal tracking-[-0.035em] sm:text-5xl">
          Hasil dalam {result.modules.length} lensa
        </h1>
        <ResultIdentitySummary
          items={result.modules.map((module) => ({ name: module.name, title: module.title }))}
        />
        <p className="text-ink-muted mt-5 max-w-2xl leading-7">{result.disclaimer}</p>
      </header>
      <p className="text-ink-muted mt-8 max-w-3xl text-sm leading-6">
        Angka menunjukkan posisi kecenderungan jawaban dari 0 sampai 100, bukan persentase akurasi
        diri.
      </p>
      <div className="mt-10 space-y-8">
        {result.modules.map((module) => (
          <section
            aria-labelledby={`shared-module-${module.key}`}
            className="border-line bg-surface rounded-[16px] border p-6"
            key={module.key}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2
                className="text-2xl font-normal tracking-[-0.025em]"
                id={`shared-module-${module.key}`}
              >
                {module.name}
              </h2>
              <span className="border-line text-ink-muted rounded-[12px] border px-3 py-1 font-mono text-xs tracking-[-0.02em] uppercase">
                {resultEvidenceLabels[module.evidenceTier] ??
                  `Tingkat bukti ${module.evidenceTier.replace("_", " ")}`}
              </span>
            </div>
            <p className="text-ink-muted mt-3">{module.title}</p>
            <p className="text-ink-muted mt-2 text-sm leading-6">{module.disclaimer}</p>
            <div className="mt-5 space-y-5">
              {orderResultScores(module.key, module.scores).map((score) => (
                <ResultScoreIndicator
                  constructKey={score.constructKey}
                  key={`${score.constructKey}-${score.facetKey}`}
                  label={score.label}
                  value={score.normalizedScore}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {result.correlations.length > 0 ? (
        <section className="mt-10" aria-labelledby="shared-correlation-heading">
          <h2 className="text-2xl font-normal tracking-[-0.025em]" id="shared-correlation-heading">
            Hubungan antar-lensa
          </h2>
          <div className="mt-5 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-2">
            {result.correlations.map((correlation) => (
              <article
                className="bg-surface p-5"
                key={`${correlation.kind}-${correlation.narrativeKey}`}
              >
                <h3 className="font-normal">
                  {correlationLabels[correlation.kind] ?? "Konteks antar-lensa"}
                </h3>
                <p className="text-ink-muted mt-2 text-sm leading-6">
                  {narrativeLabels[correlation.narrativeKey] ??
                    "Lensa yang dibagikan memberi konteks tambahan untuk dibaca sebagai refleksi."}
                </p>
                <p className="text-ink-muted mt-3 font-mono text-[0.625rem] tracking-[-0.02em] uppercase">
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

import NextImage from "next/image";
import type { SafeSharedResultView } from "@/server/repositories/result-views";
import { ResultIdentitySummary } from "@/components/result-identity-summary";
import { ResultScoreIndicator } from "@/components/result-score-indicator";
import { orderResultScores, resultEvidenceLabels } from "@/lib/report/result-presentation";
import { parseTemperament, resolveFigurineSrc, type StageCode } from "@/components/result-podium";

/**
 * Cluster stages are light fills, so the label colour is the matching dark ink.
 * White on these fills measures 2.2-2.5:1; `tests/unit/contrast.test.ts` guards it.
 */
const SHARED_STAGE = {
  NT: { fill: "#6eb5ff", panel: "#8dc4ff", ink: "#0b2f52" },
  NF: { fill: "#e882b4", panel: "#ed9dc4", ink: "#681847" },
  SJ: { fill: "#6bbf7a", panel: "#85cc92", ink: "#002109" },
  SP: { fill: "#f4845f", panel: "#f79b7f", ink: "#6c1e02" },
  NEUTRAL: { fill: "#e4e2de", panel: "#efeeea", ink: "#30312e" },
} as const;

/** Share-card hero, shared by the legacy and modular shared views. */
function SharedStageCard({
  stageCode,
  figureSrc,
  identity,
}: {
  stageCode: StageCode;
  figureSrc: string;
  identity: string;
}) {
  const stage = SHARED_STAGE[stageCode];

  return (
    <div className="bg-surface border-line relative mb-10 overflow-hidden rounded-[28px] border p-8 shadow-[0_12px_36px_rgb(27_28_26_/_0.08)] sm:p-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{ backgroundColor: stage.fill, opacity: 0.14 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
      >
        <span
          className="font-['Anton',var(--font-anton),sans-serif] text-[clamp(100px,20vw,240px)] leading-none font-black tracking-tight uppercase opacity-25"
          style={{ color: stage.fill }}
        >
          POLA
        </span>
      </div>
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative h-56 w-48 sm:h-64 sm:w-56">
          <NextImage
            src={figureSrc}
            alt="Figurine karakter hasil"
            fill
            sizes="200px"
            draggable={false}
            className="object-contain object-bottom drop-shadow-[0_14px_22px_rgb(27_28_26_/_0.16)] select-none"
          />
        </div>
        <div aria-hidden="true" className="h-3 w-40 rounded-[100%] bg-[#1b1c1a]/18 blur-[3px]" />
        <div
          className="mt-4 rounded-[14px] px-5 py-2.5 font-mono text-base font-bold tracking-wider sm:text-xl"
          style={{ backgroundColor: stage.panel, color: stage.ink }}
        >
          {identity}
        </div>
        <p className="text-ink-muted mt-3 text-sm font-medium">
          “Baca sebagai pola, bukan label tetap.”
        </p>
      </div>
    </div>
  );
}

const correlationLabels: Readonly<Record<string, string>> = {
  complementary: "Pola saling melengkapi",
  context_dependent: "Bergantung konteks situasi",
  low_confidence_conflict: "Perlu dibaca secara luwes",
  reflective_tension: "Dinamika saling mengimbangi",
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
    const t16Overlay = result.overlays.find(
      (o) => o.title.toLowerCase().includes("16") || o.label.length === 4,
    );
    const code = t16Overlay ? parseTemperament(t16Overlay.label) : parseTemperament(result.title);
    const stageCode = code ?? "NEUTRAL";
    const figureSrc = resolveFigurineSrc(stageCode, undefined, t16Overlay?.label);

    return (
      <div>
        <SharedStageCard stageCode={stageCode} figureSrc={figureSrc} identity={result.title} />

        <header className="bg-surface border-line relative overflow-hidden rounded-[20px] border p-7 shadow-[0_10px_30px_rgb(27_28_26_/_0.07)] sm:p-10">
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
          <div className="border-line bg-line mt-5 grid gap-px overflow-hidden rounded-[16px] border md:grid-cols-3">
            {result.overlays.map((overlay) => (
              <article className="bg-surface p-5" key={overlay.title}>
                <p className="mono-label text-ink">{overlay.title}</p>
                <h3 className="mt-3 text-lg font-normal">{overlay.label}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-6">{overlay.note}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="border-line bg-line mt-10 grid gap-px overflow-hidden rounded-[16px] border md:grid-cols-2">
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

  const t16Mod = result.modules.find((m) => m.key === "type_16");
  const tempMod = result.modules.find((m) => m.key === "temperament");
  const code =
    result.collectible?.group ??
    (t16Mod ? parseTemperament(t16Mod.title) : tempMod ? parseTemperament(tempMod.title) : null);
  const stageCode = code ?? "NEUTRAL";
  const figureSrc = resolveFigurineSrc(
    stageCode,
    undefined,
    result.collectible?.type16 ?? t16Mod?.title,
  );

  return (
    <div>
      <SharedStageCard
        stageCode={stageCode}
        figureSrc={figureSrc}
        identity={result.collectible?.line || result.modules.map((m) => m.title).join(" · ")}
      />

      <header className="bg-surface border-line relative overflow-hidden rounded-[20px] border p-7 shadow-[0_10px_30px_rgb(27_28_26_/_0.07)] sm:p-10">
        <p className="mono-label text-ink">Ringkasan hasil yang dibagikan</p>
        <h1 className="mt-4 text-3xl font-normal tracking-[-0.035em] sm:text-5xl">
          {result.collectible?.complete
            ? "Podium penuh 5 lensa"
            : `Hasil dalam ${result.collectible?.lensCount ?? result.modules.length} lensa`}
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
          <div className="border-line bg-line mt-5 grid gap-px overflow-hidden rounded-[16px] border md:grid-cols-2">
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

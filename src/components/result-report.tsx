import { getPublicModeName } from "@/lib/assessment/catalog";
import { buildIntegratedReflection, buildModuleReflection } from "@/lib/report/modular-report";
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
  pattern_1: "Pola 1",
  pattern_2: "Pola 2",
  pattern_3: "Pola 3",
  pattern_4: "Pola 4",
  pattern_5: "Pola 5",
  pattern_6: "Pola 6",
  pattern_7: "Pola 7",
  pattern_8: "Pola 8",
  pattern_9: "Pola 9",
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
  consistency_unavailable: "konsistensi belum tersedia",
  reverse_inconsistency: "pasangan respons kurang konsisten",
  inconsistent_pair: "pasangan forward dan reverse bertentangan",
  threshold_ambiguity: "skor dekat batas",
  excessive_midpoint: "terlalu banyak respons tengah",
  clarifier_recommended: "clarifier direkomendasikan",
  clarifier_completed: "clarifier selesai",
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

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(parsed);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/** Alternate candidate (§17.1): each engine records a shape-specific field. */
function alternateCandidate(ambiguity: Readonly<Record<string, unknown>>): string | null {
  return (
    optionalString(ambiguity.alternateType) ??
    optionalString(ambiguity.alternatePattern) ??
    optionalString(ambiguity.alternateTemperament) ??
    optionalString(ambiguity.alternate)
  );
}

/** Limitation note (§17.1): module-owned disclaimer, versioned per engine. */
function limitationNote(summary: Readonly<Record<string, unknown>>): string | null {
  return optionalString(summary.disclaimer);
}

function ReflectionList({ items }: { items: readonly string[] }) {
  return (
    <ul className="text-ink-muted mt-3 space-y-2 leading-7">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

const reportAnchors = [
  { href: "#result-meta-heading", label: "Ringkasan" },
  { href: "#quality-heading", label: "Confidence" },
  { href: "#module-sections", label: "Per lensa" },
  { href: "#practical-heading", label: "Refleksi praktis" },
];

function ModularResultReport({ result }: { result: Extract<ResultView, { kind: "modular" }> }) {
  const integrated = buildIntegratedReflection(result.modules);

  return (
    <div>
      <div className="lens-glow bg-lens-strong text-canvas relative overflow-hidden rounded-lg p-7 sm:p-10">
        <p className="text-aperture-on-dark text-sm font-semibold">Hasil modularmu</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {result.modules.length} lensa reflektif
        </h1>
        <p className="text-canvas/85 mt-5 max-w-2xl leading-7">{result.summary.disclaimer}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-canvas rounded-sm bg-white/10 px-3 py-1.5 text-sm font-semibold tabular-nums">
            Confidence keseluruhan {Math.round(result.quality.confidence * 100)}%
          </span>
          <span className="text-canvas/70 text-sm">Skor primer server-side · private</span>
        </div>
      </div>

      <nav aria-label="Navigasi laporan" className="mt-6 flex scrollbar-none gap-2 overflow-x-auto">
        {reportAnchors.map((anchor) => (
          <a
            className="focus-ring border-line text-ink-muted hover:border-lens hover:text-ink shrink-0 rounded-sm border px-3 py-1.5 text-sm transition-colors duration-150 ease-out"
            href={anchor.href}
            key={anchor.href}
          >
            {anchor.label}
          </a>
        ))}
      </nav>

      <section
        className="border-line mt-6 rounded-md border bg-white p-5"
        aria-labelledby="result-meta-heading"
      >
        <h2 className="text-ink-muted text-sm font-semibold" id="result-meta-heading">
          Ringkasan sesi
        </h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted text-xs font-semibold">Mode</dt>
            <dd className="mt-1 text-sm leading-6">{getPublicModeName(result.mode)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs font-semibold">Lensa terpilih</dt>
            <dd className="mt-1 text-sm leading-6">
              {result.summary.moduleKeys.map(formatKey).join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-xs font-semibold">Tanggal selesai</dt>
            <dd className="mt-1 text-sm leading-6">{formatDate(result.createdAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-muted text-xs font-semibold">Versi scoring</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {result.modules.map((module) => (
                <span
                  className="border-line bg-mist text-ink-muted rounded-sm border px-2.5 py-1 text-xs"
                  key={module.moduleKey}
                >
                  {formatKey(module.moduleKey)}: {module.scoringVersion}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="border-line bg-aperture-soft text-ink mt-6 rounded-md border p-5"
        aria-labelledby="quality-heading"
      >
        <h2 className="font-display text-xl font-semibold" id="quality-heading">
          Confidence dan kualitas respons
        </h2>
        <p className="mt-2 text-sm leading-6">
          Confidence menjelaskan kekuatan coverage dan konsistensi jawaban, bukan kepastian
          identitas atau validasi psikometrik formal.
        </p>
        <p className="mt-2 text-sm leading-6">
          {result.quality.flags.length > 0
            ? `Catatan private: ${result.quality.flags.map(formatKey).join(", ")}.`
            : "Tidak ada quality warning utama pada pemeriksaan otomatis."}
        </p>
      </section>

      <div className="mt-8 space-y-8" id="module-sections">
        {result.modules.map((module) => {
          const reflection = buildModuleReflection(module);
          const alternate = alternateCandidate(module.ambiguity);
          const limitation = limitationNote(module.summary);
          return (
            <section
              aria-labelledby={`module-${module.moduleKey}`}
              className="border-line rounded-lg border bg-white p-6"
              key={module.moduleKey}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  className="font-display text-2xl font-semibold capitalize"
                  id={`module-${module.moduleKey}`}
                >
                  {formatKey(module.moduleKey)}
                </h2>
                <span className="text-ink-muted text-sm tabular-nums">
                  Confidence {Math.round(module.confidence * 100)}%
                </span>
              </div>
              <div className="mt-5 space-y-5">
                {module.scores.map((score) => (
                  <div key={`${score.constructKey}-${score.facetKey}`}>
                    <div className="flex justify-between gap-4">
                      <h3 className="font-semibold capitalize">{formatKey(score.constructKey)}</h3>
                      <span className="font-semibold tabular-nums">{score.normalizedScore}</span>
                    </div>
                    <div
                      className="bg-line mt-3 h-1.5 overflow-hidden rounded-full"
                      role="img"
                      aria-label={`${formatKey(score.constructKey)} ${score.normalizedScore} dari 100`}
                    >
                      <div
                        className="bg-lens h-full rounded-full"
                        style={{ width: `${score.normalizedScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-line mt-5 flex flex-wrap items-center gap-2 border-t pt-5 text-sm">
                <span className="border-lens-soft bg-lens-soft text-lens-strong rounded-sm border px-3 py-1 font-semibold">
                  Evidence {module.evidenceTier.replace("_", " ")}
                </span>
                <span className="border-line bg-mist text-ink-muted rounded-sm border px-3 py-1 tabular-nums">
                  Completion {Math.round(module.quality.completion * 100)}%
                </span>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <article className="border-line bg-lens-soft/40 rounded-md border p-5">
                  <h3 className="font-semibold">Strengths yang mungkin terasa</h3>
                  <ReflectionList items={reflection.strengths} />
                </article>
                <article className="border-line bg-mist rounded-md border p-5">
                  <h3 className="font-semibold">Blind spots untuk diperiksa</h3>
                  <ReflectionList items={reflection.blindSpots} />
                </article>
              </div>
              <p className="text-ink-muted mt-5 text-sm leading-6">
                {reflection.practicalReflection}
              </p>
              {alternate ? (
                <p className="border-aperture-soft bg-aperture-soft text-ink mt-4 rounded-md border px-4 py-3 text-sm leading-6">
                  <span className="font-semibold">Kandidat alternatif:</span> {alternate}. Skor
                  beberapa dimensi dekat batas, jadi baca hasil ini sebagai kecenderungan, bukan
                  label pasti.
                </p>
              ) : null}
              {limitation ? (
                <p className="text-ink-muted mt-4 text-xs leading-6">
                  <span className="font-semibold">Catatan keterbatasan:</span> {limitation}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>

      {result.correlations.length > 0 ? (
        <section className="mt-8" aria-labelledby="correlation-heading">
          <h2 className="font-display text-2xl font-semibold" id="correlation-heading">
            Hubungan dan tegangan antar-lensa
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {result.correlations.map((correlation) => (
              <article
                className="border-line bg-lens-soft/40 rounded-md border p-5"
                key={correlation.ruleKey}
              >
                <h3 className="font-semibold capitalize">{formatKey(correlation.kind)}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-6">
                  {narrativeLabels[correlation.narrativeKey] ??
                    "Dua lensa memberi konteks tambahan yang perlu dibaca sebagai refleksi."}
                </p>
                <p className="text-lens-strong mt-3 text-xs font-semibold tabular-nums">
                  {correlation.sourceModuleKeys.map(formatKey).join(" · ")} · Confidence{" "}
                  {Math.round(correlation.confidence * 100)}%
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="practical-heading-title" className="mt-8" id="practical-heading">
        <h2 className="font-display text-2xl font-semibold" id="practical-heading-title">
          Refleksi praktis lintas konteks
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {[
            ["Komunikasi", integrated.communication],
            ["Belajar", integrated.learning],
            ["Kerja", integrated.work],
            ["Relasi", integrated.relationships],
            ["Saat stres", integrated.stress],
          ].map(([title, text]) => (
            <article className="border-line rounded-md border bg-white p-5" key={title}>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-ink-muted mt-2 text-sm leading-6">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Rencana pengembangan">
        <article className="border-line rounded-lg border bg-white p-6">
          <h2 className="font-display text-xl font-semibold">Growth action 7 hari</h2>
          <ReflectionList items={integrated.growth7Days} />
        </article>
        <article className="border-line rounded-lg border bg-white p-6">
          <h2 className="font-display text-xl font-semibold">Growth action 30 hari</h2>
          <ReflectionList items={integrated.growth30Days} />
        </article>
      </section>
    </div>
  );
}

export function ResultReport({ result }: { result: ResultView }) {
  if (result.kind === "modular") return <ModularResultReport result={result} />;

  return (
    <div>
      <div className="lens-glow bg-lens-strong text-canvas relative overflow-hidden rounded-lg p-7 sm:p-10">
        <p className="text-aperture-on-dark text-sm font-semibold">Profil reflektifmu</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {result.summary.archetype}
        </h1>
        <p className="text-canvas/85 mt-5 max-w-2xl leading-7">{result.summary.disclaimer}</p>
      </div>
      <section className="mt-8" aria-labelledby="trait-heading">
        <h2 className="font-display text-2xl font-semibold" id="trait-heading">
          Lima spektrum
        </h2>
        <div className="mt-5 space-y-5">
          {result.scores.map((score) => (
            <div className="border-line rounded-md border bg-white p-5" key={score.constructKey}>
              <div className="flex justify-between gap-4">
                <h3 className="font-semibold">{labels[score.constructKey]}</h3>
                <span className="font-semibold tabular-nums">{score.normalizedScore}</span>
              </div>
              <div
                className="bg-line mt-3 h-1.5 overflow-hidden rounded-full"
                role="img"
                aria-label={`${labels[score.constructKey]} ${score.normalizedScore} dari 100`}
              >
                <div
                  className="bg-lens h-full rounded-full"
                  style={{ width: `${score.normalizedScore}%` }}
                />
              </div>
              <p className="text-ink-muted mt-2 text-sm tabular-nums">
                Confidence {Math.round(score.confidence * 100)}%
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-8" aria-labelledby="overlay-heading">
        <h2 className="font-display text-2xl font-semibold" id="overlay-heading">
          Lensa reflektif legacy
        </h2>
        <p className="text-ink-muted mt-2 text-sm">
          Bagian ini dipertahankan hanya untuk kompatibilitas hasil MVP lama.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          {Object.entries(result.summary.overlays).map(([key, overlay]) => (
            <article
              className="border-line bg-lens-soft/40 min-w-[min(100%,16rem)] flex-1 rounded-md border p-5"
              key={key}
            >
              <p className="font-display text-lg font-semibold">{overlay.label}</p>
              <p className="text-ink-muted mt-2 text-sm leading-6">{overlay.note}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="border-line rounded-lg border bg-white p-6">
          <h2 className="font-display text-xl font-semibold">Pola yang menonjol</h2>
          <ReflectionList items={result.summary.strengths} />
        </section>
        <section className="border-line rounded-lg border bg-white p-6">
          <h2 className="font-display text-xl font-semibold">Arah pengembangan</h2>
          <ReflectionList items={result.summary.growthFocus} />
        </section>
      </div>
      {result.quality.straightLineWarning ? (
        <p className="border-aperture-soft bg-aperture-soft text-ink mt-6 rounded-md border p-4">
          Semua respons memakai nilai sama. Baca hasil dengan confidence lebih hati-hati.
        </p>
      ) : null}
    </div>
  );
}

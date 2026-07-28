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
  three_center: "Pola Tiga Pusat",
  temperament: "Temperamen",
  instinct: "Lensa Varian Instingtual",
  socionics_communication: "Komunikasi Socionics",
  riasec: "Minat Karier RIASEC",
  attachment: "Refleksi Attachment",
  psychosophy: "Psychosophy",
  pattern_1: "Pola 1",
  pattern_2: "Pola 2",
  pattern_3: "Pola 3",
  pattern_4: "Pola 4",
  pattern_5: "Pola 5",
  pattern_6: "Pola 6",
  pattern_7: "Pola 7",
  pattern_8: "Pola 8",
  pattern_9: "Pola 9",
  realistic: "Realistic",
  investigative: "Investigative",
  artistic: "Artistic",
  social: "Social",
  enterprising: "Enterprising",
  conventional: "Conventional",
  secure: "Secure",
  anxious: "Anxious",
  avoidant: "Avoidant",
  fearful: "Fearful",
  emotion: "Emotion",
  will: "Will",
  logic: "Logic",
  physics: "Physics",
  information_processing: "Pemrosesan Informasi",
  interaction_style: "Gaya Interaksi",
  head: "Pikiran (Head)",
  heart: "Hati (Heart)",
  gut: "Perut (Gut)",
  self_preservation: "Self-Preservation",
  one_to_one: "One-to-One",
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
  inconsistent_pair: "jawaban pada pasangan pernyataan berlawanan kurang selaras",
  threshold_ambiguity: "skor dekat batas",
  excessive_midpoint: "terlalu banyak respons tengah",
  clarifier_recommended: "pertanyaan tambahan disarankan",
  clarifier_completed: "pertanyaan tambahan selesai",
  clarifier_skipped: "pertanyaan tambahan dilewati",
  weakest_module_low_confidence: "satu lensa memiliki tingkat keyakinan rendah",
  mixed_evidence_tiers: "tingkat bukti beragam",
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
    "Tingkat keyakinan antar-lensa belum merata. Utamakan lensa dengan tingkat keyakinan lebih tinggi.",
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
    optionalString(ambiguity.alternateVariant) ??
    optionalString(ambiguity.alternate)
  );
}

/** Limitation note (§17.1): module-owned disclaimer, versioned per engine. */
function limitationNote(summary: Readonly<Record<string, unknown>>): string | null {
  return optionalString(summary.disclaimer);
}

function ambiguityNote(ambiguity: Readonly<Record<string, unknown>>): string {
  const level = typeof ambiguity.level === "number" ? ambiguity.level : null;
  if (level !== null) {
    return `Ambiguitas pola ${Math.round(level * 100)}%. Angka ini menunjukkan kedekatan skor atau batas interpretasi, bukan ketidakpastian identitas yang dapat diukur secara mutlak.`;
  }
  return "Lensa ini dibaca sebagai spektrum beberapa dimensi. Tidak ada satu label kandidat yang dianggap pasti.";
}

function ReflectionList({ items }: { items: readonly string[] }) {
  return (
    <ul className="text-ink-muted mt-3 space-y-2 leading-7">
      {items.map((item) => (
        <li className="flex gap-3" key={item}>
          <span aria-hidden="true" className="text-aperture">
            ·
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const reportAnchors = [
  { href: "#practical-heading", label: "Mulai di sini" },
  { href: "#module-sections", label: "Per lensa" },
  { href: "#share-controls", label: "Bagikan / ekspor" },
];

const evidenceTierId: Record<string, string> = {
  A: "Bukti A",
  B: "Reflektif B",
  B_EXPERIMENTAL: "Reflektif B · eksperimental",
  C: "Reflektif C",
  EXPERIMENTAL: "Eksperimental",
};

function ModularResultReport({ result }: { result: Extract<ResultView, { kind: "modular" }> }) {
  const integrated = buildIntegratedReflection(result.modules);
  const hasEvidenceOrientedModule = result.modules.some(
    (module) => module.evidenceTier !== "EXPERIMENTAL" && module.evidenceTier !== "C",
  );

  return (
    <div>
      <div className="border-y border-white/20 py-8 sm:py-12">
        <p className="mono-label text-ink">Hasil pribadi · {result.modules.length} lensa</p>
        <h1 className="mt-4 max-w-3xl text-3xl font-normal tracking-[-0.035em] sm:text-5xl">
          Baca sebagai pola, bukan batasan.
        </h1>
        <p className="text-ink-muted mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          {result.summary.disclaimer}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="border-line bg-surface rounded-[12px] border px-3 py-1.5 font-mono text-xs tracking-[-0.02em] tabular-nums">
            {hasEvidenceOrientedModule
              ? `Tingkat keyakinan ${Math.round(result.quality.confidence * 100)}%`
              : "Tingkat keyakinan tidak dihitung untuk lensa eksperimental."}
          </span>
          <span className="text-ink-muted font-mono text-xs tracking-[-0.02em] uppercase">
            Skor di server · privat
          </span>
        </div>
      </div>

      <nav
        aria-label="Navigasi laporan"
        className="sticky top-14 z-10 -mx-1 mt-6 flex scrollbar-none gap-2 overflow-x-auto border-b border-white/12 bg-[rgb(0_0_0_/_0.9)] px-1 py-3 backdrop-blur-md"
      >
        {reportAnchors.map((anchor) => (
          <a
            className="focus-ring ui-transition border-line text-ink-muted hover:border-frost/55 hover:text-ink min-h-11 shrink-0 rounded-[12px] border px-3 py-2 text-xs font-medium tracking-[-0.01em]"
            href={anchor.href}
            key={anchor.href}
          >
            {anchor.label}
          </a>
        ))}
      </nav>

      <section
        aria-labelledby="practical-heading-title"
        className="mt-10 scroll-mt-28"
        id="practical-heading"
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl font-normal tracking-[-0.025em]" id="practical-heading-title">
            Mulai dari keseharian
          </h2>
          <p className="text-ink-muted mt-2 leading-7">
            Ambil yang relevan. Sisanya boleh ditunda.
          </p>
        </div>
        <div className="mt-5 divide-y divide-white/14 border-y border-white/14">
          {[
            ["Komunikasi", integrated.communication],
            ["Belajar", integrated.learning],
            ["Kerja", integrated.work],
            ["Relasi", integrated.relationships],
            ["Saat stres", integrated.stress],
          ].map(([title, text]) => (
            <article
              className="row-hover grid gap-1 px-1 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6"
              key={title}
            >
              <h3 className="font-normal tracking-[-0.01em]">{title}</h3>
              <p className="text-ink-muted text-sm leading-7 sm:text-base">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-label="Rencana pengembangan">
        <h2 className="text-2xl font-normal tracking-[-0.025em]">Langkah berikutnya</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-2">
          <article className="bg-surface p-5 sm:p-6">
            <p className="mono-label text-ink-muted">7 hari</p>
            <h3 className="mt-2 text-lg font-normal">Mulai kecil</h3>
            <ReflectionList items={integrated.growth7Days} />
          </article>
          <article className="bg-surface p-5 sm:p-6">
            <p className="mono-label text-ink-muted">30 hari</p>
            <h3 className="mt-2 text-lg font-normal">Bangun ritme</h3>
            <ReflectionList items={integrated.growth30Days} />
          </article>
        </div>
      </section>

      <details className="border-line mt-10 border-y py-4" id="result-details">
        <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-normal [&::-webkit-details-marker]:hidden">
          <span>Detail dan tingkat keyakinan</span>
          <span aria-hidden="true" className="text-ink-muted font-mono text-lg">
            +
          </span>
        </summary>
        <h2 className="sr-only" id="result-meta-heading">
          Detail hasil
        </h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted font-mono text-[0.625rem] tracking-[-0.02em] uppercase">
              Mode
            </dt>
            <dd className="mt-1 text-sm leading-6">{getPublicModeName(result.mode)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted font-mono text-[0.625rem] tracking-[-0.02em] uppercase">
              Lensa terpilih
            </dt>
            <dd className="mt-1 text-sm leading-6">
              {result.summary.moduleKeys.map(formatKey).join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted font-mono text-[0.625rem] tracking-[-0.02em] uppercase">
              Tanggal selesai
            </dt>
            <dd className="mt-1 text-sm leading-6">{formatDate(result.createdAt)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-muted font-mono text-[0.625rem] tracking-[-0.02em] uppercase">
              Versi penilaian
            </dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {result.modules.map((module) => (
                <span
                  className="border-line text-ink-muted rounded-[12px] border px-2.5 py-1 font-mono text-xs tabular-nums"
                  key={module.moduleKey}
                >
                  {formatKey(module.moduleKey)}: {module.scoringVersion}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        <div className="border-line mt-5 border-t pt-5" aria-labelledby="quality-heading">
          <h2 className="font-normal" id="quality-heading">
            Cara membaca tingkat keyakinan
          </h2>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            Tingkat keyakinan menjelaskan kelengkapan cakupan dimensi dan konsistensi jawaban, bukan
            kepastian identitas atau validasi psikometrik formal.
          </p>
          <p className="text-ink-muted mt-2 text-sm leading-6">
            {result.quality.flags.length > 0
              ? `Catatan pribadi: ${result.quality.flags.map(formatKey).join(", ")}.`
              : "Pemeriksaan otomatis tidak menemukan catatan kualitas utama."}
          </p>
        </div>
      </details>

      <div className="mt-12 scroll-mt-28 space-y-10" id="module-sections">
        {result.modules.map((module) => {
          const reflection = buildModuleReflection(module);
          const alternate = alternateCandidate(module.ambiguity);
          const limitation = limitationNote(module.summary);
          return (
            <section
              aria-labelledby={`module-${module.moduleKey}`}
              className="border-t border-white/14 pt-8"
              key={module.moduleKey}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2
                  className="text-2xl font-normal tracking-[-0.025em] capitalize"
                  id={`module-${module.moduleKey}`}
                >
                  {formatKey(module.moduleKey)}
                </h2>
                <span className="text-ink-muted font-mono text-xs tracking-[-0.02em] uppercase tabular-nums">
                  Tingkat keyakinan {Math.round(module.confidence * 100)}%
                </span>
              </div>
              <p className="text-ink-muted mt-4 max-w-3xl leading-7">
                {reflection.practicalReflection}
              </p>
              <div className="mt-6 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-2">
                <article className="bg-surface p-5">
                  <h3 className="font-normal">Hal yang mungkin membantu</h3>
                  <ReflectionList items={reflection.strengths} />
                </article>
                <article className="bg-surface p-5">
                  <h3 className="font-normal">Hal yang perlu diperiksa</h3>
                  <ReflectionList items={reflection.blindSpots} />
                </article>
              </div>
              <details className="border-line mt-5 border-y py-3">
                <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-normal [&::-webkit-details-marker]:hidden">
                  <span>Lihat skor dan keterbatasan lensa</span>
                  <span aria-hidden="true" className="text-ink-muted font-mono text-lg">
                    +
                  </span>
                </summary>
                <div className="mt-5 space-y-5">
                  {module.scores.map((score) => (
                    <div key={`${score.constructKey}-${score.facetKey}`}>
                      <div className="flex justify-between gap-4">
                        <h3 className="font-normal capitalize">{formatKey(score.constructKey)}</h3>
                        <span className="font-mono text-sm tabular-nums">
                          {score.normalizedScore}
                        </span>
                      </div>
                      <div
                        className="bg-line mt-3 h-px overflow-visible"
                        role="img"
                        aria-label={`${formatKey(score.constructKey)} ${score.normalizedScore} dari 100`}
                      >
                        <div
                          className="bg-frost relative h-px"
                          style={{ width: `${score.normalizedScore}%` }}
                        >
                          <span className="bg-frost absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-line mt-5 flex flex-wrap items-center gap-2 border-t pt-5 text-sm">
                  <span className="border-line bg-surface rounded-[12px] border px-3 py-1 font-mono text-xs tracking-[-0.02em] uppercase">
                    {evidenceTierId[module.evidenceTier] ??
                      `Tingkat bukti ${module.evidenceTier.replace("_", " ")}`}
                  </span>
                  <span className="border-line text-ink-muted rounded-[12px] border px-3 py-1 font-mono text-xs tabular-nums">
                    Kelengkapan {Math.round(module.quality.completion * 100)}%
                  </span>
                </div>
                {alternate ? (
                  <p className="border-line bg-surface text-ink mt-4 rounded-[12px] border px-4 py-3 text-sm leading-6">
                    <span className="font-normal">Kandidat alternatif:</span> {alternate}. Skor
                    beberapa dimensi dekat batas, jadi baca hasil ini sebagai kecenderungan, bukan
                    label pasti.
                  </p>
                ) : (
                  <p className="border-line bg-surface text-ink mt-4 rounded-[12px] border px-4 py-3 text-sm leading-6">
                    <span className="font-normal">Catatan ambiguitas:</span>{" "}
                    {ambiguityNote(module.ambiguity)}
                  </p>
                )}
                {limitation ? (
                  <p className="text-ink-muted mt-4 text-xs leading-6">
                    <span className="font-normal">Catatan keterbatasan:</span> {limitation}
                  </p>
                ) : null}
              </details>
            </section>
          );
        })}
      </div>

      {result.correlations.length > 0 ? (
        <section className="mt-10" aria-labelledby="correlation-heading">
          <h2 className="text-2xl font-normal tracking-[-0.025em]" id="correlation-heading">
            Hubungan dan tegangan antar-lensa
          </h2>
          <div className="mt-5 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-2">
            {result.correlations.map((correlation) => (
              <article className="bg-surface p-5" key={correlation.ruleKey}>
                <h3 className="font-normal capitalize">{formatKey(correlation.kind)}</h3>
                <p className="text-ink-muted mt-2 text-sm leading-6">
                  {narrativeLabels[correlation.narrativeKey] ??
                    "Dua lensa memberi konteks tambahan yang perlu dibaca sebagai refleksi."}
                </p>
                <p className="text-ink-muted mt-3 font-mono text-[0.625rem] tracking-[-0.02em] uppercase tabular-nums">
                  {correlation.sourceModuleKeys.map(formatKey).join(" · ")} · Tingkat keyakinan{" "}
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
      <div className="lens-glow bg-surface relative overflow-hidden rounded-[20px] border border-white/18 p-7 sm:p-10">
        <p className="mono-label text-ink">Profil reflektif</p>
        <h1 className="mt-4 text-3xl font-normal tracking-[-0.035em] sm:text-5xl">
          {result.summary.archetype}
        </h1>
        <p className="text-ink-muted mt-5 max-w-2xl leading-7">{result.summary.disclaimer}</p>
      </div>
      <section className="mt-10" aria-labelledby="trait-heading">
        <h2 className="text-2xl font-normal tracking-[-0.025em]" id="trait-heading">
          Lima spektrum
        </h2>
        <div className="mt-5 space-y-4">
          {result.scores.map((score) => (
            <div
              className="border-line bg-surface rounded-[16px] border p-5"
              key={score.constructKey}
            >
              <div className="flex justify-between gap-4">
                <h3 className="font-normal">{labels[score.constructKey]}</h3>
                <span className="font-mono text-sm tabular-nums">{score.normalizedScore}</span>
              </div>
              <div
                className="bg-line mt-3 h-px overflow-visible"
                role="img"
                aria-label={`${labels[score.constructKey]} ${score.normalizedScore} dari 100`}
              >
                <div
                  className="bg-frost relative h-px"
                  style={{ width: `${score.normalizedScore}%` }}
                >
                  <span className="bg-frost absolute top-1/2 right-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full" />
                </div>
              </div>
              <p className="text-ink-muted mt-2 font-mono text-xs tabular-nums">
                Tingkat keyakinan {Math.round(score.confidence * 100)}%
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-10" aria-labelledby="overlay-heading">
        <h2 className="text-2xl font-normal tracking-[-0.025em]" id="overlay-heading">
          Lensa reflektif dari versi sebelumnya
        </h2>
        <p className="text-ink-muted mt-2 text-sm leading-6">
          Bagian ini dipertahankan agar hasil lama tetap dapat dibaca.
        </p>
        <div className="mt-5 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-3">
          {Object.entries(result.summary.overlays).map(([key, overlay]) => (
            <article className="bg-surface p-5" key={key}>
              <p className="text-lg font-normal">{overlay.label}</p>
              <p className="text-ink-muted mt-2 text-sm leading-6">{overlay.note}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-10 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 md:grid-cols-2">
        <section className="bg-surface p-6">
          <h2 className="text-xl font-normal tracking-[-0.02em]">Pola yang menonjol</h2>
          <ReflectionList items={result.summary.strengths} />
        </section>
        <section className="bg-surface p-6">
          <h2 className="text-xl font-normal tracking-[-0.02em]">Arah pengembangan</h2>
          <ReflectionList items={result.summary.growthFocus} />
        </section>
      </div>
      {result.quality.straightLineWarning ? (
        <p className="border-line bg-surface text-ink mt-6 rounded-[12px] border p-4 text-sm leading-6">
          Semua respons memakai nilai sama. Baca tingkat keyakinan hasil dengan lebih hati-hati.
        </p>
      ) : null}
    </div>
  );
}

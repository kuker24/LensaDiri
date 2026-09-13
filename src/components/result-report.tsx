import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { getPublicModeName } from "@/lib/assessment/catalog";
import { getIdentityJourney } from "@/lib/assessment/client";
import { getIdentityJourneyAccess } from "@/lib/assessment/journey-storage";
import { buildIntegratedReflection, buildModuleReflection } from "@/lib/report/modular-report";
import {
  ambiguityReading,
  confidenceReading,
  formatModuleResultTitle,
  formatResultKey,
  isExperimentalEvidence,
  orderResultScores,
  resultEvidenceLabels,
} from "@/lib/report/result-presentation";
import type { ResultView } from "@/server/repositories/assessment";
import { ResultIdentitySummary } from "@/components/result-identity-summary";
import { ResultScoreIndicator } from "@/components/result-score-indicator";
import { ResultPodium } from "@/components/result-podium";
import type { IdentityJourneyView } from "@/server/repositories/identity-journeys";

const labels: Record<string, string> = {
  reinforcing: "Pola saling menguatkan",
  complementary: "Pola saling melengkapi",
  reflective_tension: "Dinamika saling mengimbangi",
  context_dependent: "Bergantung konteks situasi",
  low_confidence_conflict: "Perlu dibaca secara luwes",
  too_fast: "respons sangat cepat",
  straightlining: "pola jawaban seragam",
  low_variance: "variasi respons rendah",
  consistency_unavailable: "konsistensi belum tersedia",
  reverse_inconsistency: "pasangan respons kurang selaras",
  inconsistent_pair: "jawaban pada pasangan pernyataan berlawanan kurang selaras",
  threshold_ambiguity: "kecenderungan berimbang",
  excessive_midpoint: "banyak memilih respons netral",
  clarifier_recommended: "pertanyaan penjelas disarankan",
  clarifier_completed: "pertanyaan penjelas selesai",
  clarifier_skipped: "pertanyaan penjelas dilewati",
  weakest_module_low_confidence: "satu aspek perlu dibaca lebih fleksibel",
  mixed_evidence_tiers: "kombinasi dasar riset beragam",
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
  return labels[value] ?? formatResultKey(value);
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

function ModularResultReport({ result }: { result: Extract<ResultView, { kind: "modular" }> }) {
  const integrated = buildIntegratedReflection(result.modules);
  const hasEvidenceOrientedModule = result.modules.some(
    (module) => module.evidenceTier !== "EXPERIMENTAL" && module.evidenceTier !== "C",
  );
  const identities = result.modules.map((module) => ({
    name: formatKey(module.moduleKey),
    title: formatModuleResultTitle(module.moduleKey, module.summary),
  }));

  return (
    <div>
      <div className="bg-surface border-line rounded-[28px] border p-8 shadow-[0_12px_36px_rgb(27_28_26_/_0.08)] sm:p-12">
        <h1 className="max-w-3xl font-sans text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Hasilmu dalam {result.modules.length} lensa
        </h1>
        <ResultIdentitySummary items={identities} />
        <p className="text-ink-muted mt-5 max-w-2xl text-base leading-7 sm:text-lg">
          {result.summary.disclaimer}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="bg-surface-raised border-line text-ink-muted rounded-full border px-3.5 py-1.5 font-mono text-xs tracking-[-0.01em] tabular-nums">
            {hasEvidenceOrientedModule
              ? `${confidenceReading(result.quality.confidence)} · tingkat keyakinan ${Math.round(result.quality.confidence * 100)} dari 100`
              : "Tingkat keyakinan tidak dihitung untuk lensa eksperimental."}
          </span>
          <span className="text-steel font-mono text-xs tracking-[-0.02em] uppercase">
            Dihitung aman · hanya untukmu
          </span>
        </div>
        {hasEvidenceOrientedModule ? (
          <p className="text-ink-muted mt-3 max-w-2xl text-sm leading-6">
            Tingkat keyakinan menunjukkan seberapa lengkap dan konsisten jawabanmu, bukan seberapa
            akurat sebuah label menggambarkan dirimu.
          </p>
        ) : null}
      </div>

      <nav
        aria-label="Navigasi laporan"
        className="border-line sticky top-14 z-20 -mx-1 mt-6 flex scrollbar-none gap-2 overflow-x-auto border-b bg-[rgb(251_249_245_/_0.92)] px-1 py-3 backdrop-blur-xl"
      >
        {reportAnchors.map((anchor) => (
          <a
            className="focus-ring ui-transition border-line bg-surface text-ink-muted hover:border-iris/50 hover:text-ink inline-flex min-h-10 shrink-0 items-center rounded-full border px-4.5 py-2 font-mono text-xs font-medium tracking-wider uppercase"
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
        <div className="divide-line border-line mt-5 divide-y border-y">
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
        <div className="border-line bg-line mt-5 grid gap-px overflow-hidden rounded-[16px] border md:grid-cols-2">
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
          const moduleTitle = formatModuleResultTitle(module.moduleKey, module.summary);
          const isExperimental = isExperimentalEvidence(module.evidenceTier);
          return (
            <section
              aria-labelledby={`module-${module.moduleKey}`}
              className="border-line bg-surface rounded-[18px] border p-7 shadow-[inset_0_3px_0_var(--color-iris),0_6px_20px_rgb(27_28_26_/_0.06)] sm:p-9"
              key={module.moduleKey}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2
                    className="font-sans text-2xl font-semibold tracking-[-0.025em]"
                    id={`module-${module.moduleKey}`}
                  >
                    {formatKey(module.moduleKey)}
                  </h2>
                  <p className="text-iris mt-2 text-lg font-medium">{moduleTitle}</p>
                </div>
                <span className="text-steel font-mono text-xs tracking-[-0.01em] tabular-nums">
                  {isExperimental
                    ? "Eksperimental · tanpa tingkat keyakinan keseluruhan"
                    : `${confidenceReading(module.confidence)} · ${Math.round(module.confidence * 100)} dari 100`}
                </span>
              </div>
              <p className="text-ink-muted mt-4 max-w-3xl leading-7">
                {reflection.practicalReflection}
              </p>
              <div className="border-line bg-line mt-6 grid gap-px overflow-hidden rounded-[14px] border md:grid-cols-2">
                <article className="bg-surface-raised p-5">
                  <h3 className="font-semibold">Yang terlihat dari jawabanmu</h3>
                  <ReflectionList items={reflection.strengths} />
                </article>
                <article className="bg-surface-raised p-5">
                  <h3 className="font-semibold">Yang perlu diperhatikan</h3>
                  <ReflectionList items={reflection.blindSpots} />
                </article>
              </div>
              <details className="border-line mt-5 border-y py-3">
                <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-normal [&::-webkit-details-marker]:hidden">
                  <span>Lihat kecenderungan dan batasan lensa</span>
                  <span aria-hidden="true" className="text-ink-muted font-mono text-lg">
                    +
                  </span>
                </summary>
                <p className="text-ink-muted mt-4 text-sm leading-6">
                  Angka menunjukkan posisi kecenderungan jawaban dari 0 sampai 100, bukan persentase
                  akurasi dirimu.
                </p>
                <div className="mt-5 space-y-5">
                  {orderResultScores(module.moduleKey, module.scores).map((score) => (
                    <ResultScoreIndicator
                      constructKey={score.constructKey}
                      key={`${score.constructKey}-${score.facetKey}`}
                      label={formatKey(score.constructKey)}
                      value={score.normalizedScore}
                    />
                  ))}
                </div>
                <div className="border-line mt-5 flex flex-wrap items-center gap-2 border-t pt-5 text-sm">
                  <span className="border-line bg-surface rounded-[12px] border px-3 py-1 font-mono text-xs tracking-[-0.02em] uppercase">
                    {resultEvidenceLabels[module.evidenceTier] ??
                      `Tingkat bukti ${module.evidenceTier.replace("_", " ")}`}
                  </span>
                  <span className="border-line text-ink-muted rounded-[12px] border px-3 py-1 font-mono text-xs tabular-nums">
                    Kelengkapan {Math.round(module.quality.completion * 100)}%
                  </span>
                </div>
                {alternate ? (
                  <p className="border-line bg-surface text-ink mt-4 rounded-[12px] border px-4 py-3 text-sm leading-6">
                    <span className="font-normal">Pola lain yang cukup dekat:</span>{" "}
                    {formatKey(alternate)}. Artinya, jawabanmu belum membedakan kedua pola dengan
                    tegas; perhatikan konteks saat membaca hasil.
                  </p>
                ) : (
                  <p className="border-line bg-surface text-ink mt-4 rounded-[12px] border px-4 py-3 text-sm leading-6">
                    <span className="font-normal">Seberapa jelas polanya:</span>{" "}
                    {ambiguityReading(module.ambiguity.level)}
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
          {/*
            Correlation cards are conditional, so this grid can hold 1 to 4 of
            them. The hairline used to come from a `bg-line` wrapper showing
            through `gap-px`, which meant an odd card count left the unfilled
            column painted flat grey. The wrapper is now the card colour and each
            article draws its own dividers, so a short final row simply ends.
          */}
          <div className="border-line bg-surface mt-5 grid overflow-hidden rounded-[16px] border md:grid-cols-2">
            {result.correlations.map((correlation, index) => (
              <article
                className={cn(
                  "bg-surface p-5",
                  // Row divider for every card that has one above it.
                  index >= 1 && "border-line border-t md:border-t-0",
                  index >= 2 && "md:border-line md:border-t",
                  // Column divider on the right-hand card only.
                  index % 2 === 1 && "md:border-line md:border-l",
                  // A lone card on the final row spans the full width instead of
                  // leaving an empty second column.
                  index === result.correlations.length - 1 &&
                    result.correlations.length % 2 === 1 &&
                    index > 0 &&
                    "md:col-span-2",
                )}
                key={correlation.ruleKey}
              >
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

function LegacyResultReport({ result }: { result: Extract<ResultView, { kind: "legacy" }> }) {
  return (
    <div>
      <div className="bg-surface border-line relative overflow-hidden rounded-[20px] border p-7 shadow-[0_10px_30px_rgb(27_28_26_/_0.07)] sm:p-10">
        <p className="mono-label text-ink">Profil reflektif</p>
        <h1 className="mt-4 text-3xl font-normal tracking-[-0.035em] sm:text-5xl">
          {result.summary.archetype}
        </h1>
        <ResultIdentitySummary
          items={[
            { name: "Profil Trait", title: result.summary.archetype },
            ...Object.entries(result.summary.overlays).map(([key, overlay]) => ({
              name:
                key === "type16"
                  ? "16-Type reflektif"
                  : key === "motivation"
                    ? "Motivasi reflektif"
                    : "Temperamen reflektif",
              title: overlay.label,
            })),
          ]}
        />
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
              <ResultScoreIndicator
                constructKey={score.constructKey}
                label={formatKey(score.constructKey)}
                value={score.normalizedScore}
              />
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
        <div className="border-line bg-line mt-5 grid gap-px overflow-hidden rounded-[16px] border md:grid-cols-3">
          {Object.entries(result.summary.overlays).map(([key, overlay]) => (
            <article className="bg-surface p-5" key={key}>
              <p className="text-lg font-normal">{overlay.label}</p>
              <p className="text-ink-muted mt-2 text-sm leading-6">{overlay.note}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="border-line bg-line mt-10 grid gap-px overflow-hidden rounded-[16px] border md:grid-cols-2">
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

export function ResultReport({
  result,
  token,
  children,
}: {
  result: ResultView;
  token?: string;
  /**
   * Trailing controls (share / feedback). Rendered only on the podium stage —
   * the claim and attach stages are full-screen, so anything appended after
   * them would dangle below the fold on an unrelated background.
   */
  children?: ReactNode;
}) {
  const [isUraianOpen, setIsUraianOpen] = useState(false);
  const [journeyAccess] = useState(() => getIdentityJourneyAccess());
  const [journey, setJourney] = useState<IdentityJourneyView | null>(null);

  useEffect(() => {
    if (!journeyAccess) return;
    let active = true;
    getIdentityJourney(journeyAccess.token)
      .then((value) => {
        if (active) setJourney(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [journeyAccess]);

  return (
    <div className="w-full">
      {/* First Paint: Figurine + Identity Bar + Actions (Uraian / Bagikan / Lensa lain) */}
      <ResultPodium
        {...(journey
          ? {
              characterGender: journey.characterGender,
              identity: journey.identity,
            }
          : {})}
        result={result}
        token={token}
        isUraianOpen={isUraianOpen}
        onOpenUraian={() => {
          setIsUraianOpen((prev) => {
            const next = !prev;
            if (next && typeof window !== "undefined") {
              setTimeout(() => {
                document.getElementById("uraian-section")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
            return next;
          });
        }}
      />

      {/* Accordion Uraian (closed by default) */}
      <div id="uraian-section" hidden={!isUraianOpen} className="mx-auto max-w-5xl px-4 py-8">
        <div className="bg-surface border-line rounded-[24px] border p-6 shadow-[0_10px_30px_rgb(27_28_26_/_0.07)] sm:p-10">
          <div className="border-line mb-6 flex items-center justify-between gap-4 border-b pb-4">
            <h2 className="font-display text-2xl tracking-tight uppercase sm:text-3xl">
              Uraian Laporan Mendalam
            </h2>
            <button
              type="button"
              onClick={() => setIsUraianOpen(false)}
              className="pressable focus-ring border-line text-ink-muted hover:text-ink shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs"
            >
              Tutup uraian ✕
            </button>
          </div>

          {result.kind === "modular" ? (
            <ModularResultReport result={result} />
          ) : (
            <LegacyResultReport result={result} />
          )}
        </div>
      </div>

      {children ? <div className="mx-auto max-w-5xl px-4 pb-10">{children}</div> : null}
    </div>
  );
}

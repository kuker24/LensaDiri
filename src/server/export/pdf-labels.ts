import {
  resultConstructLabels,
  resultEvidenceLabels,
  resultModuleLabels,
} from "@/lib/report/result-presentation";

/** Human labels for PDF export (Bahasa Indonesia, shared with web reports). */

/**
 * The PDF is read without the surrounding site, often printed and re-read later,
 * so a handful of module names carry a plain-language gloss that the web report
 * does not need. Everything not listed here falls through to the shared web
 * label, which keeps the two surfaces from drifting apart.
 */
const pdfModuleLabelOverrides: Readonly<Record<string, string>> = {
  attachment: "Pola Kedekatan",
  instinct: "Fokus Naluriah",
  psychosophy: "Prioritas Diri",
  riasec: "Minat Bidang Kerja",
  socionics_communication: "Gaya Komunikasi",
  three_center: "Pusat Pengambilan Keputusan",
  type_16: "Tipe 16 Karakter",
};

export const moduleLabels: Readonly<Record<string, string>> = {
  ...resultModuleLabels,
  ...pdfModuleLabelOverrides,
};

export const constructLabels = resultConstructLabels;

export const correlationKindLabels: Readonly<Record<string, string>> = {
  complementary: "Pola saling melengkapi",
  context_dependent: "Bergantung konteks",
  low_confidence_conflict: "Perlu dibaca hati-hati",
  reflective_tension: "Tegangan reflektif",
  reinforcing: "Pola saling menguatkan",
};

export const narrativeLabels: Readonly<Record<string, string>> = {
  "correlation.expression.aligned":
    "Preferensi interaksi dan gaya ekspresi terlihat saling menguatkan.",
  "correlation.expression.safe_context":
    "Gaya ekspresi dapat berubah sesuai rasa aman dan konteks sosial.",
  "correlation.mixed_confidence.caution":
    "Tingkat keyakinan antar-lensa belum merata. Utamakan lensa yang dukungan jawabannya lebih kuat.",
  "correlation.readiness.context_balance":
    "Dorongan bersiap dan kepekaan emosional memberi konteks yang saling melengkapi.",
  "correlation.readiness.sensitivity_aligned":
    "Kepekaan dan kesiapsiagaan terlihat bergerak bersama dalam responsmu.",
  "correlation.social_energy.aligned":
    "Cara kamu menggambarkan energi sosial terlihat selaras di dua lensa.",
  "correlation.social_energy.context_tension":
    "Energi sosial tampak berbeda antar-lensa. Perbedaan ini dapat menunjukkan pengaruh konteks, bukan kontradiksi mutlak.",
};

export const evidenceTierLabels = resultEvidenceLabels;

/**
 * Resolve a key to its human label.
 *
 * The fallback used to emit the raw key with underscores swapped for spaces,
 * which surfaced machine identifiers like `three center` in a document meant to
 * be read by the person who took the test. Unknown keys are now sentence-cased
 * so a missing label reads as ordinary prose instead of a leaked internal name.
 */
export function formatPdfLabel(
  value: string,
  table: Readonly<Record<string, string>> = constructLabels,
): string {
  const known = table[value];
  if (known) return known;
  const words = value.replaceAll("_", " ").trim();
  if (words.length === 0) return value;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

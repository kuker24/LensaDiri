import {
  resultConstructLabels,
  resultEvidenceLabels,
  resultModuleLabels,
} from "@/lib/report/result-presentation";

/** Human labels for PDF export (Bahasa Indonesia, shared with web reports). */

export const moduleLabels = resultModuleLabels;

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

export function formatPdfLabel(
  value: string,
  table: Readonly<Record<string, string>> = constructLabels,
): string {
  return table[value] ?? value.replaceAll("_", " ");
}

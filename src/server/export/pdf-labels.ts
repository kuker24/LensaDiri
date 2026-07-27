/** Human labels for PDF export (Bahasa Indonesia, Soft Product report). */

export const moduleLabels: Readonly<Record<string, string>> = {
  attachment: "Refleksi Attachment",
  enneagram: "Enneagram",
  instinct: "Varian Instingtual",
  psychosophy: "Psychosophy",
  riasec: "Minat Karier RIASEC",
  socionics_communication: "Komunikasi Socionics",
  temperament: "Temperamen",
  three_center: "Pola Tiga Pusat",
  trait_profile: "Profil Trait",
  type_16: "16-Type",
};

export const constructLabels: Readonly<Record<string, string>> = {
  agreeableness: "Kooperasi",
  anxious: "Anxious",
  artistic: "Artistic",
  avoidant: "Avoidant",
  choleric: "Penggerak",
  conscientiousness: "Keteraturan",
  conventional: "Conventional",
  emotion: "Emotion",
  emotional_sensitivity: "Kepekaan emosi",
  enneagram: "Enneagram",
  enterprising: "Enterprising",
  extraversion: "Energi sosial",
  fearful: "Fearful",
  feeling: "Pertimbangan manusia",
  gut: "Perut (Gut)",
  head: "Pikiran (Head)",
  heart: "Hati (Heart)",
  information_processing: "Pemrosesan Informasi",
  interaction_style: "Gaya Interaksi",
  intuition: "Pola dan kemungkinan",
  investigative: "Investigative",
  judging: "Struktur keputusan",
  logic: "Logic",
  melancholic: "Mendalam",
  one_to_one: "One-to-One",
  openness: "Keterbukaan",
  pattern_1: "Pola 1",
  pattern_2: "Pola 2",
  pattern_3: "Pola 3",
  pattern_4: "Pola 4",
  pattern_5: "Pola 5",
  pattern_6: "Pola 6",
  pattern_7: "Pola 7",
  pattern_8: "Pola 8",
  pattern_9: "Pola 9",
  phlegmatic: "Stabil",
  physics: "Physics",
  realistic: "Realistic",
  sanguine: "Ekspresif",
  secure: "Secure",
  self_preservation: "Self-Preservation",
  social: "Social",
  temperament: "Temperamen",
  three_center: "Pola Tiga Pusat",
  trait_profile: "Profil Trait",
  type_16: "16-Type",
  will: "Will",
};

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
    "Confidence antar-lensa belum merata. Utamakan lensa dengan confidence yang lebih tinggi.",
  "correlation.readiness.context_balance":
    "Dorongan bersiap dan kepekaan emosional memberi konteks yang saling melengkapi.",
  "correlation.readiness.sensitivity_aligned":
    "Kepekaan dan kesiapsiagaan terlihat bergerak bersama dalam responsmu.",
  "correlation.social_energy.aligned":
    "Cara kamu menggambarkan energi sosial terlihat selaras di dua lensa.",
  "correlation.social_energy.context_tension":
    "Energi sosial tampak berbeda antar-lensa. Perbedaan ini dapat menunjukkan pengaruh konteks, bukan kontradiksi mutlak.",
};

export const evidenceTierLabels: Readonly<Record<string, string>> = {
  A: "Bukti A",
  B: "Reflektif B",
  B_EXPERIMENTAL: "Reflektif B · eksperimental",
  C: "Reflektif C",
  EXPERIMENTAL: "Eksperimental",
};

export function formatPdfLabel(
  value: string,
  table: Readonly<Record<string, string>> = constructLabels,
): string {
  return table[value] ?? value.replaceAll("_", " ");
}

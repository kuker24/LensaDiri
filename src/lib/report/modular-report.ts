import type { IndependentModuleResult, ModuleDimensionScore } from "@/lib/scoring/modules/types";

export interface ModuleReflectionSection {
  readonly blindSpots: readonly string[];
  readonly moduleKey: string;
  readonly practicalReflection: string;
  readonly strengths: readonly string[];
}

export interface IntegratedReflectionReport {
  readonly communication: string;
  readonly growth30Days: readonly string[];
  readonly growth7Days: readonly string[];
  readonly learning: string;
  readonly relationships: string;
  readonly stress: string;
  readonly work: string;
}

const constructLabels: Readonly<Record<string, string>> = {
  agreeableness: "kooperasi",
  anxious: "kecemasan dalam relasi",
  artistic: "ekspresi kreatif",
  avoidant: "menjaga jarak",
  choleric: "dorongan bertindak",
  conscientiousness: "keteraturan",
  conventional: "struktur dan presisi",
  emotion: "emosi dan perasaan",
  emotional_sensitivity: "kepekaan emosi",
  enterprising: "kepemimpinan",
  extraversion: "energi sosial",
  fearful: "takut keintiman",
  feeling: "pertimbangan manusia",
  gut: "tindakan dan insting",
  head: "analisis dan pemahaman",
  heart: "perasaan dan relasi",
  information_processing: "pemrosesan informasi",
  interaction_style: "gaya interaksi",
  intuition: "pola dan kemungkinan",
  investigative: "analisis dan riset",
  judging: "struktur keputusan",
  logic: "analisis rasional",
  melancholic: "refleksi mendalam",
  one_to_one: "kedekatan intim",
  openness: "keterbukaan",
  phlegmatic: "ritme stabil",
  physics: "realitas konkret",
  realistic: "aktivitas konkret",
  sanguine: "ekspresi spontan",
  secure: "aman dalam relasi",
  self_preservation: "keamanan diri",
  social: "dinamika sosial",
  will: "kehendak dan aksi",
};

function label(key: string): string {
  return constructLabels[key] ?? key.replaceAll("_", " ");
}

function orderedScores(resultModule: IndependentModuleResult): readonly ModuleDimensionScore[] {
  return resultModule.scores.toSorted(
    (left, right) =>
      right.normalizedScore - left.normalizedScore ||
      left.constructKey.localeCompare(right.constructKey),
  );
}

function describeBand(score: ModuleDimensionScore): string {
  if (score.normalizedScore >= 65)
    return `kecenderungan ${label(score.constructKey)} cukup menonjol`;
  if (score.normalizedScore <= 35)
    return `kecenderungan ${label(score.constructKey)} lebih selektif atau kontekstual`;
  return `kecenderungan ${label(score.constructKey)} relatif seimbang`;
}

export function buildModuleReflection(
  resultModule: IndependentModuleResult,
): ModuleReflectionSection {
  const ordered = orderedScores(resultModule);
  const strongest = ordered[0];
  const second = ordered[1];
  const lowest = ordered.at(-1);

  return {
    blindSpots: lowest
      ? [
          `Saat ${label(lowest.constructKey)} tidak menjadi respons utama, kebutuhan pada sisi ini dapat terlambat disadari.`,
          "Periksa konteks sebelum menjadikan satu pola sebagai aturan tetap tentang dirimu.",
        ]
      : ["Data belum cukup untuk menyusun blind spot yang stabil."],
    moduleKey: resultModule.moduleKey,
    practicalReflection: strongest
      ? `Amati kapan ${label(strongest.constructKey)} membantumu dan kapan kamu perlu menyeimbangkannya dengan respons lain.`
      : "Gunakan hasil sebagai bahan refleksi, bukan label mutlak.",
    strengths: [strongest, second]
      .filter((score): score is ModuleDimensionScore => score !== undefined)
      .map((score) => `Responsmu menunjukkan ${describeBand(score)}.`),
  };
}

function findScore(
  modules: readonly IndependentModuleResult[],
  constructKey: string,
): ModuleDimensionScore | null {
  for (const resultModule of modules) {
    const score = resultModule.scores.find((candidate) => candidate.constructKey === constructKey);
    if (score) return score;
  }
  return null;
}

function contextualSentence(
  score: ModuleDimensionScore | null,
  high: string,
  balanced: string,
  low: string,
): string {
  if (!score) return balanced;
  if (score.normalizedScore >= 65) return high;
  if (score.normalizedScore <= 35) return low;
  return balanced;
}

export function buildIntegratedReflection(
  modules: readonly IndependentModuleResult[],
): IntegratedReflectionReport {
  const extraversion = findScore(modules, "extraversion");
  const feeling = findScore(modules, "feeling") ?? findScore(modules, "agreeableness");
  const openness = findScore(modules, "openness") ?? findScore(modules, "intuition");
  const structure = findScore(modules, "conscientiousness") ?? findScore(modules, "judging");
  const sensitivity = findScore(modules, "emotional_sensitivity");
  const steadiness = findScore(modules, "phlegmatic");

  return {
    communication: `${contextualSentence(
      extraversion,
      "Kamu cenderung memproses gagasan melalui interaksi aktif.",
      "Kamu dapat berganti antara berbicara dan memproses sendiri sesuai konteks.",
      "Kamu cenderung menyusun pikiran lebih dulu sebelum membagikannya.",
    )} ${contextualSentence(
      feeling,
      "Dampak pada orang dan cara penyampaian sering menjadi pertimbangan penting.",
      "Kamu dapat menimbang dampak manusia dan kriteria objektif secara bersamaan.",
      "Kejelasan kriteria dapat lebih menonjol daripada kebutuhan menjaga suasana.",
    )}`,
    growth30Days: [
      "Catat tiga situasi mingguan ketika pola utama membantu dan satu situasi ketika pola itu perlu diseimbangkan.",
      "Minta umpan balik dari satu orang tepercaya tentang gaya komunikasi atau kerja yang paling terasa.",
      "Ulangi satu eksperimen kecil selama empat minggu dan evaluasi dampaknya berdasarkan perilaku nyata.",
    ],
    growth7Days: [
      "Pilih satu pola paling menonjol dan amati pemicunya selama tujuh hari.",
      "Coba satu respons alternatif pada situasi berisiko rendah.",
      "Tulis refleksi singkat tentang konteks yang membuat hasil terasa cocok atau tidak cocok.",
    ],
    learning: `${contextualSentence(
      openness,
      "Pembelajaran berbasis konsep, hubungan pola, dan eksplorasi kemungkinan dapat terasa menarik.",
      "Kombinasikan gambaran besar dengan contoh konkret dan latihan bertahap.",
      "Contoh nyata, instruksi jelas, dan penerapan langsung dapat membantu pemahaman.",
    )} Gunakan hasil untuk menguji strategi belajar, bukan membatasi pilihanmu.`,
    relationships: contextualSentence(
      feeling,
      "Dalam relasi, kamu mungkin cepat membaca kebutuhan dan dampak emosional, tetapi tetap perlu menyatakan batas secara eksplisit.",
      "Kedekatan dapat berkembang ketika kebutuhan, batas, dan asumsi dibicarakan secara langsung.",
      "Kamu mungkin lebih nyaman dengan kejelasan dan konsistensi daripada membaca sinyal emosional yang tidak disampaikan.",
    ),
    stress: `${contextualSentence(
      sensitivity,
      "Saat tekanan naik, intensitas emosi atau kewaspadaan dapat meningkat lebih cepat.",
      "Respons stresmu kemungkinan bergantung pada konteks dan beban yang sedang berjalan.",
      "Kamu mungkin tampak tenang, tetapi tetap perlu memeriksa tanda lelah yang tidak langsung terasa.",
    )} ${contextualSentence(
      steadiness,
      "Ritme stabil dapat menjadi sumber regulasi saat situasi berubah.",
      "Jeda, prioritas singkat, dan dukungan sosial dapat membantu menjaga ritme.",
      "Perubahan ritme yang disengaja dapat membantu ketika kamu mulai tertahan terlalu lama.",
    )}`,
    work: contextualSentence(
      structure,
      "Target, urutan kerja, dan definisi selesai yang jelas dapat memperkuat konsistensi.",
      "Gunakan struktur ringan yang tetap memberi ruang untuk menyesuaikan prioritas.",
      "Ruang improvisasi dapat membantu energi kerja, tetapi checkpoint sederhana mencegah detail penting terlewat.",
    ),
  };
}

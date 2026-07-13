import { scoreWeightedLikert, type ItemPolarity, type LikertValue } from "@/lib/scoring/likert";

export const traitKeys = [
  "openness",
  "conscientiousness",
  "extraversion",
  "agreeableness",
  "emotional_sensitivity",
] as const;

export type TraitKey = (typeof traitKeys)[number];

export type ProfileAnswer = {
  constructKey: TraitKey;
  polarity: ItemPolarity;
  value: LikertValue;
  weight: number;
};

export type TraitScore = {
  confidence: number;
  constructKey: TraitKey;
  normalizedScore: number;
  rawScore: number;
};

export type ProfileSummary = {
  archetype: string;
  disclaimer: string;
  growthFocus: string[];
  overlays: {
    motivation: { label: string; note: string };
    temperament: { label: string; note: string };
    type16: { label: string; note: string };
  };
  strengths: string[];
  traitScores: Record<TraitKey, number>;
};

export type ScoredProfile = {
  quality: {
    answeredItems: number;
    confidence: number;
    straightLineWarning: boolean;
  };
  scores: TraitScore[];
  scoringVersion: "trait-profile-mvp-1";
  summary: ProfileSummary;
};

const traitLabels: Record<TraitKey, string> = {
  agreeableness: "kooperatif",
  conscientiousness: "terarah",
  emotional_sensitivity: "peka",
  extraversion: "ekspresif",
  openness: "eksploratif",
};

const growthCopy: Record<TraitKey, string> = {
  agreeableness: "Latih batas sehat ketika membantu atau menyesuaikan diri.",
  conscientiousness: "Sisakan ruang fleksibel ketika rencana berubah.",
  emotional_sensitivity: "Bangun jeda pemulihan saat tekanan mulai menumpuk.",
  extraversion: "Seimbangkan interaksi dengan waktu untuk memproses pikiran.",
  openness: "Ubah ide menarik menjadi satu eksperimen kecil yang konkret.",
};

export function scoreProfile(answers: readonly ProfileAnswer[]): ScoredProfile {
  const groups = new Map<TraitKey, ProfileAnswer[]>();
  for (const key of traitKeys) {
    groups.set(key, []);
  }
  for (const answer of answers) {
    groups.get(answer.constructKey)?.push(answer);
  }

  const scores = traitKeys.map((constructKey) => {
    const responses = groups.get(constructKey) ?? [];
    if (responses.length === 0) {
      throw new RangeError(`Missing responses for ${constructKey}.`);
    }
    const score = scoreWeightedLikert(responses);
    return {
      confidence: Number(Math.min(1, responses.length / 12).toFixed(4)),
      constructKey,
      normalizedScore: score.normalizedScore,
      rawScore: score.weightedAverage,
    };
  });

  const ordered = scores.toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const top = ordered.slice(0, 2);
  const bottom = ordered[ordered.length - 1];
  const uniqueValues = new Set(answers.map((answer) => answer.value)).size;
  const confidence = Number(
    (scores.reduce((total, score) => total + score.confidence, 0) / scores.length).toFixed(4),
  );

  const traitScoreMap = Object.fromEntries(
    scores.map((score) => [score.constructKey, score.normalizedScore]),
  ) as Record<TraitKey, number>;
  const type16 = `${traitScoreMap.extraversion >= 50 ? "E" : "I"}${traitScoreMap.openness >= 50 ? "N" : "S"}${traitScoreMap.agreeableness >= 50 ? "F" : "T"}${traitScoreMap.conscientiousness >= 50 ? "J" : "P"}`;
  const motivation =
    ordered[0]?.constructKey === "conscientiousness"
      ? "Pola 1w2 · perbaikan"
      : ordered[0]?.constructKey === "agreeableness"
        ? "Pola 2w1 · keterhubungan"
        : ordered[0]?.constructKey === "openness"
          ? "Pola 5w4 · pemahaman"
          : ordered[0]?.constructKey === "emotional_sensitivity"
            ? "Pola 6w5 · kesiapsiagaan"
            : "Pola 7w6 · pengalaman";
  const temperament =
    traitScoreMap.extraversion >= 50
      ? traitScoreMap.emotional_sensitivity >= 50
        ? "Ekspresif-peka"
        : "Ekspresif-stabil"
      : traitScoreMap.emotional_sensitivity >= 50
        ? "Tenang-peka"
        : "Tenang-stabil";

  return {
    quality: {
      answeredItems: answers.length,
      confidence,
      straightLineWarning: uniqueValues === 1,
    },
    scores,
    scoringVersion: "trait-profile-mvp-1",
    summary: {
      archetype: top.map((score) => traitLabels[score.constructKey]).join(" dan "),
      disclaimer:
        "Profil ini adalah lensa refleksi berbasis jawabanmu, bukan diagnosis atau batas kepribadian.",
      growthFocus: bottom ? [growthCopy[bottom.constructKey]] : [],
      overlays: {
        motivation: {
          label: motivation,
          note: "Enneagram-inspired Tier B dari pola trait dominan; core dan wing ini bukan tipe resmi atau diagnosis.",
        },
        temperament: {
          label: temperament,
          note: "Lensa gaya Tier B untuk refleksi, bukan kategori biologis atau diagnosis.",
        },
        type16: {
          label: type16,
          note: "Kode 16-Type Jungian-inspired Tier B dari threshold trait; bukan instrumen proprietary.",
        },
      },
      strengths: top.map(
        (score) =>
          `Pola ${traitLabels[score.constructKey]} terlihat relatif menonjol pada respons ini.`,
      ),
      traitScores: traitScoreMap,
    },
  };
}

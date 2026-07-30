export const resultModuleLabels: Readonly<Record<string, string>> = {
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

export const resultConstructLabels: Readonly<Record<string, string>> = {
  agreeableness: "Kooperasi",
  anxious: "Kecemasan dalam relasi",
  artistic: "Ekspresi kreatif",
  avoidant: "Menjaga jarak",
  choleric: "Dorongan bertindak",
  conscientiousness: "Keteraturan",
  conventional: "Struktur dan presisi",
  emotion: "Emosi",
  emotional_sensitivity: "Kepekaan emosi",
  enterprising: "Kepemimpinan",
  extraversion: "Energi sosial",
  fearful: "Tarik-ulur kedekatan",
  feeling: "Pertimbangan manusia",
  gut: "Perut / insting",
  head: "Pikiran / analisis",
  heart: "Hati / relasi",
  information_processing: "Cara memproses informasi",
  interaction_style: "Gaya berinteraksi",
  intuition: "Pola dan kemungkinan",
  investigative: "Analisis dan riset",
  judging: "Struktur keputusan",
  logic: "Logika",
  melancholic: "Refleksi mendalam",
  one_to_one: "Kedekatan satu-ke-satu",
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
  phlegmatic: "Ritme stabil",
  physics: "Kebutuhan fisik",
  realistic: "Aktivitas praktis",
  sanguine: "Ekspresi spontan",
  secure: "Rasa aman dalam relasi",
  self_preservation: "Keamanan diri",
  social: "Dinamika sosial",
  will: "Kehendak dan aksi",
};

export const resultEvidenceLabels: Readonly<Record<string, string>> = {
  A: "Bukti A",
  B: "Reflektif B",
  B_EXPERIMENTAL: "Reflektif B · eksperimental",
  C: "Reflektif C",
  EXPERIMENTAL: "Eksperimental",
};

const temperamentLabels: Readonly<Record<string, string>> = {
  choleric: "Koleris",
  melancholic: "Melankolis",
  phlegmatic: "Plegmatis",
  sanguine: "Sanguinis",
};

const attachmentLabels: Readonly<Record<string, string>> = {
  anxious: "Cemas dalam relasi",
  avoidant: "Menjaga jarak",
  fearful: "Tarik-ulur kedekatan",
  secure: "Aman dalam relasi",
};

const centerLabels: Readonly<Record<string, string>> = {
  gut: "Perut / insting",
  head: "Pikiran / analisis",
  heart: "Hati / relasi",
};

const instinctLabels: Readonly<Record<string, string>> = {
  one_to_one: "Kedekatan satu-ke-satu",
  self_preservation: "Keamanan diri",
  social: "Peran sosial",
};

export const bipolarResultAxes: Readonly<
  Record<string, readonly [lowLabel: string, highLabel: string]>
> = {
  agreeableness: ["Kurang mengarah ke kooperasi", "Lebih mengarah ke kooperasi"],
  conscientiousness: ["Kurang mengarah ke keteraturan", "Lebih mengarah ke keteraturan"],
  emotional_sensitivity: ["Kepekaan lebih rendah", "Kepekaan lebih tinggi"],
  extraversion: ["Memproses sendiri", "Lewat interaksi"],
  feeling: ["Kriteria objektif", "Dampak manusia"],
  intuition: ["Konkret", "Pola dan kemungkinan"],
  judging: ["Adaptif", "Terstruktur"],
  openness: ["Kurang mengarah ke keterbukaan", "Lebih mengarah ke keterbukaan"],
};

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function optionalStringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

function sentenceCase(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

function patternNumber(value: string | null): string | null {
  const match = value?.match(/^pattern_([1-9])$/u);
  return match?.[1] ?? null;
}

export function formatResultKey(value: string): string {
  return (
    resultConstructLabels[value] ??
    resultModuleLabels[value] ??
    sentenceCase(value.replaceAll("_", " "))
  );
}

export function formatModuleResultTitle(
  moduleKey: string,
  summary: Readonly<Record<string, unknown>>,
): string {
  if (moduleKey === "type_16") {
    return optionalString(summary.primaryType) ?? resultModuleLabels[moduleKey]!;
  }

  if (moduleKey === "enneagram") {
    const core = patternNumber(optionalString(summary.corePattern));
    const wing = patternNumber(optionalString(summary.wing));
    if (core) return `Pola ${core}${wing ? `w${wing}` : ""}`;
  }

  if (moduleKey === "temperament") {
    const primary = optionalString(summary.primary);
    const secondary = optionalString(summary.secondary);
    if (primary) {
      const primaryLabel = temperamentLabels[primary] ?? formatResultKey(primary);
      const secondaryLabel = secondary
        ? (temperamentLabels[secondary] ?? formatResultKey(secondary))
        : null;
      return secondaryLabel ? `${primaryLabel} + ${secondaryLabel}` : primaryLabel;
    }
  }

  if (moduleKey === "riasec") {
    return optionalString(summary.hollandCode) ?? resultModuleLabels[moduleKey]!;
  }

  if (moduleKey === "attachment") {
    const dominant = optionalString(summary.dominantPattern);
    if (dominant) return attachmentLabels[dominant] ?? formatResultKey(dominant);
  }

  if (moduleKey === "instinct") {
    const primary = optionalString(summary.primaryVariant);
    if (primary) return instinctLabels[primary] ?? formatResultKey(primary);
  }

  if (moduleKey === "three_center") {
    const primary = optionalString(summary.primaryCenter);
    if (primary) return centerLabels[primary] ?? formatResultKey(primary);
  }

  if (moduleKey === "psychosophy") {
    const priorities = optionalStringArray(summary.priorityOrder).slice(0, 2);
    if (priorities.length > 0) return priorities.map(formatResultKey).join(" > ");
  }

  if (moduleKey === "socionics_communication") {
    const pattern = optionalString(summary.communicationPattern);
    if (pattern) return sentenceCase(pattern);
  }

  return sentenceCase(
    optionalString(summary.archetype) ?? resultModuleLabels[moduleKey] ?? moduleKey,
  );
}

export function scoreReading(value: number): string {
  if (value >= 65) return "Menonjol";
  if (value <= 35) return "Kurang menonjol";
  return "Cukup seimbang";
}

export function confidenceReading(value: number): string {
  if (value >= 0.8) return "Dukungan kuat";
  if (value >= 0.6) return "Cukup terbaca";
  if (value >= 0.4) return "Perlu konteks";
  return "Baca hati-hati";
}

export function ambiguityReading(value: unknown): string {
  if (typeof value !== "number") {
    return "Lensa ini paling berguna bila dibaca sebagai beberapa kecenderungan sekaligus.";
  }
  if (value < 0.35) return "Pola utama terlihat cukup jelas pada jawaban saat ini.";
  if (value < 0.7) return "Ada pola alternatif yang cukup dekat dengan pola utama.";
  return "Beberapa pola hampir sama kuat, jadi konteks keseharian penting saat membacanya.";
}

export function isExperimentalEvidence(tier: string): boolean {
  return tier === "EXPERIMENTAL" || tier === "C";
}

export function orderResultScores<
  Score extends { readonly constructKey: string; readonly normalizedScore: number },
>(moduleKey: string, scores: readonly Score[]): readonly Score[] {
  if (
    moduleKey === "trait_profile" ||
    moduleKey === "type_16" ||
    moduleKey === "socionics_communication"
  ) {
    return scores;
  }
  return scores.toSorted(
    (left, right) =>
      right.normalizedScore - left.normalizedScore ||
      left.constructKey.localeCompare(right.constructKey),
  );
}

import { groupFromType16, type CollectibleIdentity } from "@/lib/assessment/identity-journey";
import {
  enneagramCenters,
  enneagramInstinctCodes,
  type EnneagramConstructKey,
} from "@/lib/scoring/modules/enneagram";
import {
  psychosophyPositionLetters,
  psychosophySuperscripts,
  type PsychosophyConstructKey,
} from "@/lib/scoring/modules/psychosophy";
import { socionicsLetters, socionicsSlotOrder } from "@/lib/scoring/modules/socionics";
import { sloanLetterOrder } from "@/lib/scoring/modules/trait-profile";
import { type16Letters, type16ConstructKeys } from "@/lib/scoring/modules/type16";
import { formatResultKey } from "@/lib/report/result-presentation";

/**
 * Explains where every character of the identity line came from.
 *
 * The line reads `ENFJ sp125 EII SLOAI V¹L²F³E⁴ NF` — six segments of dense
 * notation that the result page and the PDF both print without ever saying how
 * they were derived. Each segment has a deterministic rule inside its scoring
 * engine, so the rule can be shown rather than left implicit.
 *
 * Two constraints shape this module.
 *
 * It reads the letter maps exported by the engines instead of restating them. A
 * copy would let a threshold change in an engine leave this explanation quietly
 * wrong, which is worse than no explanation.
 *
 * It verifies itself. `letters` joined back together must equal the stored code,
 * and a segment that fails that check is dropped rather than shown. That is what
 * keeps the Socionics swap honest: `rationality` reorders the printed letters
 * without printing one of its own, so a naive walk can produce the right letters
 * in the wrong order.
 */

/** Threshold every letter-bearing lens splits on. */
const NEUTRAL = 50;

export type IdentityCodeCharacter = Readonly<{
  /** Construct that decided this character, or null when it is not a measurement. */
  constructKey: string | null;
  /** The construct in plain Indonesian, or null alongside a null `constructKey`. */
  constructLabel: string | null;
  /** The printed character, e.g. `E`, `sp`, `V¹`. */
  glyph: string;
  /** Why this character and not the alternative. */
  reason: string;
  /** Score behind it, when a score decided it. */
  score: number | null;
}>;

export type IdentityCodeSegment = Readonly<{
  /** Full segment as printed, e.g. `ENFJ`. */
  code: string;
  characters: readonly IdentityCodeCharacter[];
  /** How the segment as a whole is built. */
  rule: string;
  /** Lens name, e.g. `16-Type`. */
  sourceLabel: string;
}>;

type ScoreLike = Readonly<{ constructKey: string; normalizedScore: number }>;

type ModuleLike = Readonly<{
  moduleKey: string;
  scores: readonly ScoreLike[];
  summary: Readonly<Record<string, unknown>>;
}>;

function findScore(scores: readonly ScoreLike[], constructKey: string): number | null {
  const match = scores.find((score) => score.constructKey === constructKey);
  return match ? match.normalizedScore : null;
}

/** Rounded for display only; comparisons always use the raw value. */
function formatScore(value: number): string {
  return String(Math.round(value));
}

function sideReason(score: number, chosen: string, other: string): string {
  return score >= NEUTRAL
    ? `Skor ${formatScore(score)} berada di atau di atas titik seimbang 50, jadi ${chosen} yang terpilih, bukan ${other}.`
    : `Skor ${formatScore(score)} berada di bawah titik seimbang 50, jadi ${chosen} yang terpilih, bukan ${other}.`;
}

/**
 * A segment only ships when its characters spell the stored code exactly.
 *
 * Anything else means this module and the engine disagree, and a wrong
 * explanation of a code is worse than none.
 */
function verifiedSegment(
  segment: IdentityCodeSegment | null,
  expected: string | undefined,
): IdentityCodeSegment | null {
  if (!segment || !expected) return null;
  const joined = segment.characters.map((character) => character.glyph).join("");
  return joined === expected && segment.code === expected ? segment : null;
}

/** Segment 1: four letters, one per construct, each split at 50. */
function type16Segment(module: ModuleLike | undefined, expected: string | undefined) {
  if (!module) return null;
  const characters = type16ConstructKeys.map((constructKey) => {
    const score = findScore(module.scores, constructKey);
    const pair = type16Letters[constructKey];
    const glyph = (score ?? NEUTRAL) >= NEUTRAL ? pair[1] : pair[0];
    const other = glyph === pair[1] ? pair[0] : pair[1];
    return {
      constructKey,
      constructLabel: formatResultKey(constructKey),
      glyph,
      reason:
        score === null ? "Skor konstruk ini tidak tersedia." : sideReason(score, glyph, other),
      score,
    } satisfies IdentityCodeCharacter;
  });
  return verifiedSegment(
    {
      characters,
      code: characters.map((character) => character.glyph).join(""),
      rule: "Empat sisi diukur terpisah. Tiap sisi memilih satu huruf dari dua kemungkinan, tergantung posisi skornya terhadap titik seimbang 50.",
      sourceLabel: formatResultKey("type_16"),
    },
    expected,
  );
}

/**
 * Segment 2: instinct prefix, then the leading pattern, then the leading pattern
 * of each remaining centre.
 *
 * Unlike the other lenses this one ranks rather than thresholds, so the reason
 * text names the competitor it beat instead of pointing at 50.
 */
function enneagramSegment(module: ModuleLike | undefined, expected: string | undefined) {
  if (!module) return null;
  const patternScores = module.scores
    .filter((score): score is ScoreLike => Object.hasOwn(enneagramCenters, score.constructKey))
    .toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const core = patternScores[0];
  const instinct = module.scores
    .filter((score) => score.constructKey.startsWith("instinct_"))
    .toSorted((left, right) => right.normalizedScore - left.normalizedScore)[0];
  if (!core || !instinct || !Object.hasOwn(enneagramInstinctCodes, instinct.constructKey)) {
    return null;
  }
  const centerOf = (key: string) => enneagramCenters[key as EnneagramConstructKey];
  const coreCenter = centerOf(core.constructKey);
  const remaining = (["gut", "heart", "head"] as const)
    .map(
      (center) =>
        patternScores
          .filter((score) => centerOf(score.constructKey) === center)
          .toSorted((left, right) => right.normalizedScore - left.normalizedScore)[0],
    )
    .filter((score): score is ScoreLike => Boolean(score))
    .filter((score) => centerOf(score.constructKey) !== coreCenter)
    .toSorted((left, right) => right.normalizedScore - left.normalizedScore);
  const digitOf = (key: string) => key.slice("pattern_".length);
  const characters: IdentityCodeCharacter[] = [
    {
      constructKey: instinct.constructKey,
      constructLabel: formatResultKey(instinct.constructKey),
      glyph: enneagramInstinctCodes[instinct.constructKey as keyof typeof enneagramInstinctCodes],
      reason: `Dari tiga fokus insting, ini yang skornya paling tinggi (${formatScore(instinct.normalizedScore)}).`,
      score: instinct.normalizedScore,
    },
    {
      constructKey: core.constructKey,
      constructLabel: formatResultKey(core.constructKey),
      glyph: digitOf(core.constructKey),
      reason: `Pola dengan skor tertinggi di antara sembilan pola (${formatScore(core.normalizedScore)}).`,
      score: core.normalizedScore,
    },
    ...remaining.map((score) => ({
      constructKey: score.constructKey,
      constructLabel: formatResultKey(score.constructKey),
      glyph: digitOf(score.constructKey),
      reason: `Pola tertinggi (${formatScore(score.normalizedScore)}) dari kelompok lain, agar ketiga kelompok terwakili.`,
      score: score.normalizedScore,
    })),
  ];
  return verifiedSegment(
    {
      characters,
      code: characters.map((character) => character.glyph).join(""),
      rule: "Diawali fokus insting yang paling menonjol, lalu pola tertinggi, lalu pola tertinggi dari dua kelompok sisanya. Angka di sini urutan peringkat, bukan nilai.",
      sourceLabel: formatResultKey("enneagram"),
    },
    expected,
  );
}

/**
 * Segment 3: three letters from three constructs, ordered by a fourth.
 *
 * `rationality` prints nothing of its own but decides whether judgment or
 * perception leads, so the same three letters can appear in two orders. It is
 * listed as a trailing character-less note through `rule` rather than as a glyph.
 */
function socionicsSegment(module: ModuleLike | undefined, expected: string | undefined) {
  if (!module) return null;
  const rationality = findScore(module.scores, "rationality");
  const isRational = (rationality ?? NEUTRAL) >= NEUTRAL;
  const characters = socionicsSlotOrder(isRational).map((constructKey) => {
    const score = findScore(module.scores, constructKey);
    const pair = socionicsLetters[constructKey];
    const glyph = (score ?? NEUTRAL) >= NEUTRAL ? pair[1] : pair[0];
    const other = glyph === pair[1] ? pair[0] : pair[1];
    return {
      constructKey,
      constructLabel: formatResultKey(constructKey),
      glyph,
      reason:
        score === null ? "Skor konstruk ini tidak tersedia." : sideReason(score, glyph, other),
      score,
    } satisfies IdentityCodeCharacter;
  });
  const orderNote =
    rationality === null
      ? ""
      : ` Urutan hurufnya ditentukan oleh ${formatResultKey("rationality").toLowerCase()} (skor ${formatScore(rationality)}): ${
          isRational
            ? "huruf cara menilai ditempatkan lebih dulu"
            : "huruf cara menyerap informasi ditempatkan lebih dulu"
        }.`;
  return verifiedSegment(
    {
      characters,
      code: characters.map((character) => character.glyph).join(""),
      rule: `Tiga huruf dari tiga sisi yang diukur, masing-masing dibandingkan dengan titik seimbang 50.${orderNote}`,
      sourceLabel: formatResultKey("socionics_communication"),
    },
    expected,
  );
}

/** Segment 4: one letter per trait, always in the same slot order. */
function sloanSegment(module: ModuleLike | undefined, expected: string | undefined) {
  if (!module) return null;
  const characters = sloanLetterOrder.map((entry) => {
    const score = findScore(module.scores, entry.constructKey);
    const glyph = (score ?? NEUTRAL) >= NEUTRAL ? entry.letters[1] : entry.letters[0];
    const other = glyph === entry.letters[1] ? entry.letters[0] : entry.letters[1];
    return {
      constructKey: entry.constructKey,
      constructLabel: formatResultKey(entry.constructKey),
      glyph,
      reason:
        score === null ? "Skor konstruk ini tidak tersedia." : sideReason(score, glyph, other),
      score,
    } satisfies IdentityCodeCharacter;
  });
  return verifiedSegment(
    {
      characters,
      code: characters.map((character) => character.glyph).join(""),
      rule: "Lima trait, satu huruf per trait, selalu pada urutan posisi yang sama. Tiap huruf hanya menandai sisi mana dari titik seimbang 50.",
      sourceLabel: formatResultKey("trait_profile"),
    },
    expected,
  );
}

/**
 * Segment 5: four aspects ranked against each other.
 *
 * No threshold here at all. The superscript is the rank, so the reason text
 * reports the position and the score without mentioning 50.
 */
function psychosophySegment(module: ModuleLike | undefined, expected: string | undefined) {
  if (!module) return null;
  const ordered = module.scores.toSorted(
    (left, right) => right.normalizedScore - left.normalizedScore,
  );
  if (ordered.length !== psychosophySuperscripts.length) return null;
  const positions = ["pertama", "kedua", "ketiga", "keempat"] as const;
  const characters: IdentityCodeCharacter[] = [];
  for (const [index, score] of ordered.entries()) {
    const letter = psychosophyPositionLetters[score.constructKey as PsychosophyConstructKey];
    const superscript = psychosophySuperscripts[index];
    const position = positions[index];
    if (!letter || !superscript || !position) return null;
    characters.push({
      constructKey: score.constructKey,
      constructLabel: formatResultKey(score.constructKey),
      glyph: `${letter}${superscript}`,
      reason: `Menempati urutan ${position} dengan skor ${formatScore(score.normalizedScore)}. Angka kecil di atas huruf adalah urutan itu, bukan nilai.`,
      score: score.normalizedScore,
    });
  }
  return verifiedSegment(
    {
      characters,
      code: characters.map((character) => character.glyph).join(""),
      rule: "Empat aspek diurutkan satu terhadap yang lain, dari skor tertinggi ke terendah. Lensa ini tidak memakai titik seimbang 50.",
      sourceLabel: formatResultKey("psychosophy"),
    },
    expected,
  );
}

/**
 * Segment 6: the two middle letters of segment 1.
 *
 * Not a measurement, so it carries no score. It is included because the line
 * prints it and an unexplained trailing pair invites the reading that a sixth
 * lens produced it.
 */
function groupSegment(type16: string | undefined, expected: string | undefined) {
  const group = groupFromType16(type16 ?? null);
  if (!group || !type16) return null;
  return verifiedSegment(
    {
      characters: [
        {
          constructKey: null,
          constructLabel: null,
          glyph: group,
          reason: `Dua huruf tengah dari ${type16}. Ini pengelompokan dari lensa pertama, bukan lensa keenam, jadi tidak ada pengukuran terpisah di baliknya.`,
          score: null,
        },
      ],
      code: group,
      rule: "Ringkasan kelompok, disalin dari dua huruf tengah kode pertama.",
      sourceLabel: "Kelompok",
    },
    expected,
  );
}

/**
 * Explains the identity line segment by segment, in printed order.
 *
 * Order follows the line itself: 16-Type, Enneagram, Socionics, Sloan,
 * Psychosophy, then the group pair. A segment is omitted when its lens did not
 * run, when its code is absent, or when its characters fail to spell the stored
 * code — never replaced with a placeholder.
 */
export function buildIdentityCodeLegend(
  modules: readonly ModuleLike[],
  identity: CollectibleIdentity,
): readonly IdentityCodeSegment[] {
  const byKey = new Map(modules.map((module) => [module.moduleKey, module]));
  return [
    type16Segment(byKey.get("type_16"), identity.type16),
    enneagramSegment(byKey.get("enneagram"), identity.enneagram),
    socionicsSegment(byKey.get("socionics_communication"), identity.socionics),
    sloanSegment(byKey.get("trait_profile"), identity.sloan),
    psychosophySegment(byKey.get("psychosophy"), identity.psyche),
    groupSegment(identity.type16, identity.group),
  ].filter((segment): segment is IdentityCodeSegment => segment !== null);
}

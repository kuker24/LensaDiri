/**
 * Type/cluster theme resolution, free of React and browser APIs.
 *
 * This lives outside `result-podium.tsx` because that component is a Client
 * Component (`"use client"`). The PDF export runs on the server and needs the
 * same stage colours and type resolution, so importing from the podium would
 * drag a client module into the server bundle. The podium re-exports these
 * symbols, so existing call sites and tests keep working unchanged.
 */
import type { ResultView } from "@/server/repositories/assessment";

/**
 * Cluster stages. `bg`/`panel` are light fills; `ink` is the only text colour
 * that stays legible on them. White on these fills measures 2.2-2.5:1, so it is
 * never used for labels — `tests/unit/contrast.test.ts` guards this.
 */
export const STAGE_THEMES = {
  NT: { bg: "#6EB5FF", panel: "#8DC4FF", ink: "#0b2f52", name: "Rasional" },
  NF: { bg: "#E882B4", panel: "#ED9DC4", ink: "#681847", name: "Idealis" },
  SJ: { bg: "#6BBF7A", panel: "#85CC92", ink: "#002109", name: "Penjaga" },
  SP: { bg: "#F4845F", panel: "#F79B7F", ink: "#6c1e02", name: "Penjelajah" },
  NEUTRAL: { bg: "#E4E2DE", panel: "#EFEEEA", ink: "#30312E", name: "Belum ditentukan" },
} as const;

export type StageCode = keyof typeof STAGE_THEMES;

export type StageTheme = {
  bg: string;
  panel: string;
  ink: string;
  code: StageCode;
};

export function parseTemperament(code: string): "NT" | "NF" | "SJ" | "SP" | null {
  const c = code.toUpperCase().trim();
  if (c.includes("NT") || /^[EI]NT[JP]$/u.test(c)) return "NT";
  if (c.includes("NF") || /^[EI]NF[JP]$/u.test(c)) return "NF";
  if (c.includes("SJ") || /^[EI]S[TF]J$/u.test(c)) return "SJ";
  if (c.includes("SP") || /^[EI]S[TF]P$/u.test(c)) return "SP";
  return null;
}

/**
 * The 16 reflective type codes. Every one ships a render for both bodies as
 * `{CODE}-laki.png` and `{CODE}-perempuan.png`, plus a gender-neutral
 * `{CODE}.png` used by surfaces that must not imply a body.
 */
export const TYPE_CODES: ReadonlySet<string> = new Set([
  "ENFJ",
  "ENFP",
  "ENTJ",
  "ENTP",
  "ESFJ",
  "ESFP",
  "ESTJ",
  "ESTP",
  "INFJ",
  "INFP",
  "INTJ",
  "INTP",
  "ISFJ",
  "ISFP",
  "ISTJ",
  "ISTP",
]);

/**
 * Extract the reflective 16-type code from a result, when one is present.
 *
 * Legacy results expose it as a trait-derived overlay label; modular results
 * expose it as the `type_16` module summary. Returns null when neither exists,
 * so callers fall back to a cluster stand-in instead of inventing a type.
 */
export function resolveTypeCode(result: ResultView): string | null {
  const raw =
    result.kind === "legacy"
      ? result.summary.overlays?.type16?.label
      : (() => {
          const mod = result.modules.find((m) => m.moduleKey === "type_16");
          if (mod && typeof mod.summary === "object" && mod.summary !== null) {
            return (mod.summary as { primaryType?: string }).primaryType;
          }
          return undefined;
        })();
  const match = raw?.toUpperCase().match(/\b[EI][NS][TF][JP]\b/u);
  return match ? match[0] : null;
}

export function resolveStageTheme(result: ResultView): StageTheme {
  if (result.kind === "legacy") {
    const t16 = result.summary.overlays?.type16?.label;
    if (t16) {
      const code = parseTemperament(t16);
      if (code) return { ...STAGE_THEMES[code], code };
    }
    const temp = result.summary.overlays?.temperament?.label?.toLowerCase() || "";
    if (temp.includes("koleris") || temp.includes("nt")) return { ...STAGE_THEMES.NT, code: "NT" };
    if (temp.includes("plegmatis") || temp.includes("nf"))
      return { ...STAGE_THEMES.NF, code: "NF" };
    if (temp.includes("melankolis") || temp.includes("sj"))
      return { ...STAGE_THEMES.SJ, code: "SJ" };
    if (temp.includes("sanguinis") || temp.includes("sp"))
      return { ...STAGE_THEMES.SP, code: "SP" };
    return { ...STAGE_THEMES.NEUTRAL, code: "NEUTRAL" };
  }

  // Modular
  const type16Mod = result.modules.find((m) => m.moduleKey === "type_16");
  if (type16Mod && typeof type16Mod.summary === "object" && type16Mod.summary !== null) {
    const pType = (type16Mod.summary as { primaryType?: string }).primaryType;
    if (pType) {
      const code = parseTemperament(pType);
      if (code) return { ...STAGE_THEMES[code], code };
    }
  }

  const tempMod = result.modules.find((m) => m.moduleKey === "temperament");
  if (tempMod && typeof tempMod.summary === "object" && tempMod.summary !== null) {
    const p = (tempMod.summary as { primary?: string }).primary?.toLowerCase() || "";
    if (p.includes("koleris") || p === "nt") return { ...STAGE_THEMES.NT, code: "NT" };
    if (p.includes("plegmatis") || p === "nf") return { ...STAGE_THEMES.NF, code: "NF" };
    if (p.includes("melankolis") || p === "sj") return { ...STAGE_THEMES.SJ, code: "SJ" };
    if (p.includes("sanguinis") || p === "sp") return { ...STAGE_THEMES.SP, code: "SP" };
  }

  return { ...STAGE_THEMES.NEUTRAL, code: "NEUTRAL" };
}

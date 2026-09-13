"use client";

import NextImage from "next/image";
import { useState } from "react";
import type { ResultView } from "@/server/repositories/assessment";
import { getStoredGender, type CharacterGender } from "@/lib/assessment/gender-storage";
import { postAuthenticatedMutation } from "@/lib/auth/client";
import {
  buildCollectibleIdentity,
  type CollectibleIdentity,
} from "@/lib/assessment/identity-journey";
import type { IdentityJourneyView } from "@/server/repositories/identity-journeys";

export type ResultPodiumProps = {
  artifacts?: IdentityJourneyView["artifacts"];
  characterGender?: CharacterGender;
  completedLensCount?: number;
  identity?: CollectibleIdentity;
  result: ResultView;
  token?: string | undefined;
  onOpenUraian: () => void;
  isUraianOpen: boolean;
  onShare?: (() => void) | undefined;
};

/**
 * Cluster stages. `bg`/`panel` are light fills; `ink` is the only text colour
 * that stays legible on them. White on these fills measures 2.2-2.5:1, so it is
 * never used for labels — `tests/unit/contrast.test.ts` guards this.
 */
const STAGE_THEMES = {
  NT: { bg: "#6EB5FF", panel: "#8DC4FF", ink: "#0b2f52", name: "Rasional" },
  NF: { bg: "#E882B4", panel: "#ED9DC4", ink: "#681847", name: "Idealis" },
  SJ: { bg: "#6BBF7A", panel: "#85CC92", ink: "#002109", name: "Penjaga" },
  SP: { bg: "#F4845F", panel: "#F79B7F", ink: "#6c1e02", name: "Penjelajah" },
  NEUTRAL: { bg: "#E4E2DE", panel: "#EFEEEA", ink: "#30312E", name: "Belum ditentukan" },
} as const;

export type StageCode = keyof typeof STAGE_THEMES;

export function parseTemperament(code: string): "NT" | "NF" | "SJ" | "SP" | null {
  const c = code.toUpperCase().trim();
  if (c.includes("NT") || /^[EI]NT[JP]$/u.test(c)) return "NT";
  if (c.includes("NF") || /^[EI]NF[JP]$/u.test(c)) return "NF";
  if (c.includes("SJ") || /^[EI]S[TF]J$/u.test(c)) return "SJ";
  if (c.includes("SP") || /^[EI]S[TF]P$/u.test(c)) return "SP";
  return null;
}

/**
 * Reviewed plain type renders in `public/figurines`, grouped by the gender each
 * render depicts.
 *
 * A render may only be listed under the gender it actually portrays. Listing one
 * under both is what previously showed a masculine figurine to a user who had
 * picked `perempuan`. Most of the 16 types have no reviewed render yet, so both
 * sets stay intentionally sparse; add an entry only once its asset ships.
 */
const PLAIN_TYPE_RENDERS: Readonly<Record<CharacterGender, ReadonlySet<string>>> = {
  perempuan: new Set(["ENFP"]),
  laki: new Set(["ESTP", "INTJ", "ISFJ"]),
};

/**
 * Pick the figurine image for a result.
 *
 * A typed render is used only when it exists for the selected gender, so the
 * figurine never contradicts the user's own pick. Anything else falls back to
 * the plain body: a missing render must never be replaced by another type from
 * the same broad group, nor by the same type drawn as another gender.
 *
 * `gender` is omitted on public share, where owner gender must not be inferable
 * from the image. That path therefore always renders a plain body.
 */
export function resolveFigurineSrc(
  stageCode: StageCode,
  gender?: CharacterGender,
  typeCode?: string,
): string {
  const exact = typeCode?.toUpperCase().trim();
  if (exact && gender && PLAIN_TYPE_RENDERS[gender].has(exact)) {
    return `/figurines/${exact}-plain.png`;
  }
  return gender === "laki" ? "/figurines/base-male.png" : "/figurines/base-female.png";
}

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

export function resolveStageTheme(result: ResultView): {
  bg: string;
  panel: string;
  ink: string;
  code: StageCode;
} {
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

export function resolveVisualOverlays(result: ResultView) {
  let hasSocionics = false;
  let enneaNumber: string | null = null;
  let psycheOrbs: { letter: string; color: string; textColor: string }[] | null = null;

  if (result.kind === "legacy") {
    const mot = result.summary.overlays?.motivation?.label;
    if (mot) {
      const match = mot.match(/\d+/);
      if (match) enneaNumber = match[0];
    }
    return { hasSocionics, enneaNumber, psycheOrbs };
  }

  // Modular
  const socionicsMod = result.modules.find((m) => m.moduleKey === "socionics_communication");
  if (socionicsMod) {
    hasSocionics = true;
  }

  const enneagramMod = result.modules.find((m) => m.moduleKey === "enneagram");
  if (enneagramMod && typeof enneagramMod.summary === "object" && enneagramMod.summary !== null) {
    const summary = enneagramMod.summary as { compactCode?: string; corePattern?: string };
    const compactCore = summary.compactCode?.match(/(?:sp|so|sx)(\d)/u)?.[1];
    const legacyCore = summary.corePattern?.match(/\d+/u)?.[0];
    enneaNumber = compactCore ?? legacyCore ?? null;
  }

  const psycheMod = result.modules.find((m) => m.moduleKey === "psychosophy");
  if (psycheMod && typeof psycheMod.summary === "object" && psycheMod.summary !== null) {
    const order = (psycheMod.summary as { priorityOrder?: string[] }).priorityOrder;
    if (Array.isArray(order) && order.length > 0) {
      const orbMap: Record<string, { letter: string; color: string; textColor: string }> = {
        logic: { letter: "L", color: "from-amber-400 to-yellow-200", textColor: "text-amber-950" },
        will: { letter: "V", color: "from-sky-400 to-blue-200", textColor: "text-sky-950" },
        emotion: { letter: "E", color: "from-pink-400 to-rose-200", textColor: "text-pink-950" },
        physics: {
          letter: "F",
          color: "from-emerald-400 to-teal-200",
          textColor: "text-emerald-950",
        },
      };
      psycheOrbs = order
        .map((key) => orbMap[key])
        .filter((o): o is { letter: string; color: string; textColor: string } => Boolean(o));
    }
  }

  return { hasSocionics, enneaNumber, psycheOrbs };
}

export function buildCompactIdentityString(result: ResultView): string {
  return result.kind === "modular" ? buildCollectibleIdentity(result.modules).line : "";
}

export function ResultPodium({
  artifacts,
  characterGender,
  completedLensCount,
  identity,
  result,
  token,
  onOpenUraian,
  isUraianOpen,
  onShare,
}: ResultPodiumProps) {
  const [gender] = useState<CharacterGender>(() => getStoredGender());
  const [copied, setCopied] = useState(false);
  const [sharePending, setSharePending] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const journeyGroup = identity?.group;
  const stage = journeyGroup
    ? { ...STAGE_THEMES[journeyGroup], code: journeyGroup }
    : resolveStageTheme(result);
  const identityString = identity?.line || buildCompactIdentityString(result);
  const figureSrc = resolveFigurineSrc(
    stage.code,
    characterGender ?? gender,
    identity?.type16 ?? resolveTypeCode(result) ?? undefined,
  );
  const visualResult =
    artifacts && artifacts.length > 0
      ? ({
          kind: "modular",
          modules: artifacts.map((artifact) => ({
            moduleKey: artifact.moduleKey,
            summary: artifact.summary,
          })),
        } as unknown as ResultView)
      : result;
  const { hasSocionics, enneaNumber, psycheOrbs } = resolveVisualOverlays(visualResult);
  const hasTraitFinish =
    artifacts?.some((artifact) => artifact.moduleKey === "trait_profile") ?? false;

  const moduleCount = completedLensCount ?? (result.kind === "modular" ? result.modules.length : 1);
  const isFullPodium = identity?.complete === true;

  async function handleShareClick() {
    if (onShare) {
      onShare();
      return;
    }
    if (!token) {
      setShareError("Token tidak ditemukan.");
      return;
    }
    try {
      setSharePending(true);
      setShareError(null);
      const data = await postAuthenticatedMutation<{ shareToken?: string }>("/api/result/share", {
        token,
      });
      if (data?.shareToken) {
        const publicUrl = `${window.location.origin}/shared/${data.shareToken}`;
        await navigator.clipboard.writeText(publicUrl).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        setShareError("Gagal membuat tautan berbagi.");
      }
    } catch {
      setShareError("Gagal membuat tautan berbagi.");
    } finally {
      setSharePending(false);
    }
  }

  return (
    <div
      className="bg-canvas text-ink relative flex min-h-screen w-full flex-col justify-between font-sans"
      style={
        {
          "--stage": stage.bg,
          "--stage-panel": stage.panel,
          "--stage-ink": stage.ink,
        } as React.CSSProperties
      }
    >
      {/* Ambient cluster wash: the stage colour lives in the light, not the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] overflow-hidden"
      >
        <div className="absolute -top-48 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--stage)] opacity-[0.17] blur-3xl transition-colors duration-500" />
        <div className="absolute top-1/4 -right-28 h-80 w-80 rounded-full bg-[var(--stage-panel)] opacity-25 blur-2xl transition-colors duration-500" />
      </div>

      {/* Header Atas */}
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="font-['Anton',var(--font-anton),sans-serif] text-base tracking-[0.18em] uppercase sm:text-lg">
            LENSADIRI
          </span>
          <span className="h-2 w-2 rounded-full bg-[var(--stage)]" />
          <span className="text-steel mono-label border-line ml-1 border-l pl-3">
            {isFullPodium ? "Podium penuh" : "Koleksi aktif"}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-full bg-[var(--stage-panel)] px-3.5 py-1.5 font-mono text-xs font-bold"
          style={{ color: stage.ink }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {moduleCount} / 5 lensa selesai
        </span>
      </header>

      {/* Main Hero Podium: 2 Columns Layout */}
      <main className="relative z-20 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-8 px-6 py-6 sm:px-12 lg:grid-cols-12">
        {/* Kolom Kiri: Figur 3D cutout + Teks Ghost POLA + Tatakan Akrilik */}
        <section className="relative flex flex-col items-center justify-center lg:col-span-6">
          {/* Ghost Display POLA */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
          >
            <span className="font-['Anton',var(--font-anton),sans-serif] text-[clamp(140px,26vw,360px)] leading-none font-black tracking-tight text-[var(--stage)] uppercase opacity-[0.22]">
              POLA
            </span>
          </div>

          {/* Ambient Glow */}
          <div className="pointer-events-none absolute h-72 w-72 -translate-y-4 rounded-full bg-[var(--stage-panel)] opacity-30 blur-3xl sm:h-96 sm:w-96" />

          {/* Figurine Display Container */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative h-[380px] w-64 sm:h-[480px] sm:w-80">
              <NextImage
                src={figureSrc}
                alt="Figurine Hasil Karakter LensaDiri"
                fill
                sizes="(max-width: 640px) 70vw, 360px"
                priority
                draggable={false}
                className={`object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)] filter select-none ${hasTraitFinish ? "contrast-[1.06] saturate-[0.9]" : ""}`}
              />

              {/* ATRIBUT VISUAL TERPASANG (SLOT OVERLAYS) */}
              {/* 1. Collar Gem (Socionics) */}
              {hasSocionics && (
                <div
                  className="pointer-events-none absolute top-[30%] left-1/2 z-20 -translate-x-1/2"
                  aria-hidden="true"
                >
                  <div className="h-3 w-3 rotate-45 border border-white bg-[#2ecc71] shadow-[0_0_8px_rgba(46,204,113,0.8)]" />
                </div>
              )}

              {/* 2. Medallion (Enneagram) */}
              {enneaNumber && (
                <div
                  className="pointer-events-none absolute top-[33%] left-1/2 z-20 flex -translate-x-1/2 flex-col items-center"
                  aria-hidden="true"
                >
                  <div className="h-2 w-8 rounded-full border-b border-amber-300 drop-shadow" />
                  <div className="-mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-gradient-to-tr from-amber-500 to-yellow-200 shadow-sm">
                    <span className="font-['Anton',var(--font-anton),sans-serif] text-[8px] leading-none text-amber-950">
                      {enneaNumber}
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Psyche Orbs (Psychosophy) */}
              {psycheOrbs && psycheOrbs.length > 0 && (
                <div
                  className="pointer-events-none absolute top-[39%] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1"
                  aria-hidden="true"
                >
                  {psycheOrbs.map((orb, i) => (
                    <div
                      key={i}
                      className={`flex h-2.5 w-2.5 items-center justify-center rounded-full border border-white bg-gradient-to-tr ${orb.color} shadow-sm`}
                    >
                      <span className={`text-[5px] leading-none font-bold ${orb.textColor}`}>
                        {orb.letter}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grounding contact shadow & Tatakan Acrylic Disk */}
            <div className="pointer-events-none relative -mt-6 flex h-14 w-72 items-center justify-center sm:w-80">
              <div className="absolute top-0 h-5 w-56 rounded-[100%] bg-[#1b1c1a]/18 blur-[4px]" />
              <div className="bg-surface border-line flex h-10 w-64 items-center justify-center rounded-[100%] border shadow-[0_4px_14px_rgb(27_28_26_/_0.10)] sm:w-72">
                <span
                  className="font-mono text-[10px] font-bold tracking-[0.22em] uppercase"
                  style={{ color: stage.ink }}
                >
                  Figurine · POLA {stage.code}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Kolom Kanan: Identitas Pola + Aksi */}
        <section className="flex flex-col justify-center space-y-5 lg:col-span-6 lg:max-w-xl">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-full bg-[var(--stage)] px-3.5 py-1 text-[11px] font-extrabold tracking-[0.09em] uppercase"
              style={{ color: stage.ink }}
            >
              {isFullPodium ? "Koleksi lengkap" : "Koleksi parsial"}
            </span>
            <span className="text-ink-muted text-xs font-medium tracking-wide">
              Hasil refleksi LensaDiri
            </span>
          </div>

          <h1 className="font-['Anton',var(--font-anton),sans-serif] text-[clamp(34px,7vw,60px)] leading-[1.02] tracking-tight uppercase">
            {isFullPodium ? "PODIUM PENUH" : "POLAMU SAAT INI"}
          </h1>

          {/* Card Identitas Pola Karakter */}
          <div className="bg-surface border-line rounded-[20px] border p-5 shadow-[0_10px_28px_rgb(27_28_26_/_0.08)]">
            <div className="text-steel mono-label mb-2.5">Identitas pola karakter</div>
            <div className="bg-surface-raised border-line overflow-x-auto rounded-[14px] border px-4 py-3 text-center font-mono text-lg font-bold tracking-wider whitespace-nowrap sm:text-2xl">
              {identityString}
            </div>
          </div>

          {/* Kutipan Penegasan */}
          <div className="space-y-1.5 border-l-[3px] border-[var(--stage)] py-0.5 pl-4">
            <p className="text-lg leading-snug font-medium tracking-tight sm:text-xl">
              “Baca sebagai pola, bukan kotak tetap.”
            </p>
            <p className="text-ink-muted text-xs leading-relaxed">
              Ringkasan ini hanya memuat lensa yang sudah selesai. Detail dan batasannya tersedia di
              bagian uraian.
            </p>
          </div>

          {/* Accordion Toggle Bar: Detail Sinergi Atribut */}
          <button
            type="button"
            onClick={onOpenUraian}
            aria-expanded={isUraianOpen}
            aria-controls="uraian-section"
            className="pressable focus-ring bg-surface border-line text-ink-muted hover:text-ink flex w-full cursor-pointer items-center justify-between rounded-[14px] border px-4 py-3.5 text-xs shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <svg
                aria-hidden="true"
                className="text-steel h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-ink font-semibold">Detail laporan &amp; uraian</span>
              <span
                className="rounded bg-[var(--stage-panel)] px-2 py-0.5 font-mono text-[10px] font-bold"
                style={{ color: stage.ink }}
              >
                {isUraianOpen ? "Terbuka" : "Tertutup"}
              </span>
            </div>
            <svg
              aria-hidden="true"
              className={`text-steel h-4 w-4 transition-transform duration-200 ${isUraianOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Baris 3 Tombol Aksi (Touch Target 48px) */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {/* Tombol 1: Uraian */}
            <button
              type="button"
              onClick={onOpenUraian}
              aria-expanded={isUraianOpen}
              aria-controls="uraian-section"
              className="pressable focus-ring bg-surface border-line text-ink flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] border px-3 text-xs font-bold tracking-wide shadow-sm sm:text-sm"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              <span>Uraian</span>
            </button>

            {/* Tombol 2: Bagikan */}
            <button
              type="button"
              onClick={handleShareClick}
              disabled={sharePending}
              style={{ color: stage.ink }}
              className="pressable focus-ring flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[var(--stage)] px-3 text-xs font-bold tracking-wide shadow-[0_6px_16px_rgb(27_28_26_/_0.14)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>{copied ? "Tersalin!" : sharePending ? "Memproses…" : "Bagikan"}</span>
            </button>
          </div>

          {shareError && (
            <p
              className="text-danger bg-danger-soft border-danger/20 mt-2 rounded-[12px] border px-3 py-2 text-center text-xs font-semibold"
              role="alert"
            >
              {shareError}
            </p>
          )}
        </section>
      </main>

      {/* Footer Minimalis */}
      <footer className="text-steel relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 pb-5 font-mono text-[11px] sm:px-10">
        <span>Tersimpan otomatis · tanpa akun &amp; pelacak iklan</span>
        <span className="hidden sm:inline">Hasil privat sampai dibagikan</span>
      </footer>
    </div>
  );
}

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
import { buildIdentityCodeLegend } from "@/lib/report/identity-code-legend";
import {
  resolveStageTheme,
  resolveTypeCode,
  STAGE_THEMES,
  TYPE_CODES,
  type StageCode,
} from "@/lib/report/type-theme";

/**
 * Re-exported so existing importers (and the shared report) keep a single entry
 * point. The implementations moved to `@/lib/report/type-theme` because the PDF
 * export runs on the server and cannot import a Client Component.
 */
export {
  parseTemperament,
  resolveStageTheme,
  resolveTypeCode,
  STAGE_THEMES,
  type StageCode,
} from "@/lib/report/type-theme";

export type ResultPodiumProps = {
  characterGender?: CharacterGender;
  identity?: CollectibleIdentity;
  result: ResultView;
  token?: string | undefined;
  onOpenUraian: () => void;
  isUraianOpen: boolean;
  onShare?: (() => void) | undefined;
};

/**
 * Pick the figurine image for a result.
 *
 * The typed render always matches the picked body, so the figurine can never
 * contradict the user's own pick. A type is never substituted by another type
 * from the same broad group.
 *
 * `gender` is omitted on public share, where owner gender must not be inferable
 * from the image. That path renders one fixed plain body regardless of type, so
 * the picture reveals nothing about who owns the result.
 */
export function resolveFigurineSrc(
  stageCode: StageCode,
  gender?: CharacterGender,
  typeCode?: string,
): string {
  if (!gender) {
    return "/figurines/base-female.png";
  }
  const exact = typeCode?.toUpperCase().trim();
  if (exact && TYPE_CODES.has(exact)) {
    return `/figurines/${exact}-${gender}.png`;
  }
  return gender === "laki" ? "/figurines/base-male.png" : "/figurines/base-female.png";
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
  characterGender,
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
  const isFullPodium = identity?.complete === true;

  /**
   * The identity line is one dense token run, which is exact but hard to read at
   * a glance. `identity` already carries each lens code separately, so the same
   * information is also listed per lens with a plain-language label. Only lenses
   * that actually finished appear; nothing is filled with a placeholder.
   */
  const lensRows: { code: string; label: string }[] = (
    [
      { code: identity?.type16, label: "Gaya kognitif" },
      { code: identity?.enneagram, label: "Motivasi inti" },
      { code: identity?.socionics, label: "Gaya komunikasi" },
      { code: identity?.sloan, label: "Pola sifat" },
      { code: identity?.psyche, label: "Prioritas jiwa" },
      // The trailing pair is printed in the line too, and had no row at all, so
      // it was the one segment with no label anywhere on the page.
      { code: identity?.group, label: "Kelompok" },
    ] satisfies { code: string | undefined; label: string }[]
  ).filter((row): row is { code: string; label: string } => Boolean(row.code));

  /**
   * Where each character of the line came from.
   *
   * The line and the rows above say which lens produced which code, but never how
   * the letters were chosen, so the notation arrives unexplained. The legend
   * derives that from the same scores the engines used, and drops any segment it
   * cannot reproduce exactly rather than guessing.
   */
  const codeLegend =
    result.kind === "modular"
      ? buildIdentityCodeLegend(
          result.modules,
          identity ?? buildCollectibleIdentity(result.modules),
        )
      : [];

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

      {/*
       * No podium header here on purpose. The site chrome already renders the
       * LENSADIRI wordmark on this route, so a second one stacked the same mark
       * twice, and the lens counter repeated what the identity line below states
       * precisely.
       */}

      {/* Main Hero Podium: 2 Columns Layout */}
      <main className="relative z-20 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-8 px-6 py-6 sm:px-12 lg:grid-cols-12">
        {/* Kolom Kiri: Figur 3D cutout + Teks Ghost POLA + Tatakan Akrilik */}
        <section className="relative flex flex-col items-center justify-center lg:col-span-6">
          {/* Ghost Display POLA */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
          >
            <span className="font-display text-[clamp(140px,26vw,360px)] leading-none font-black tracking-tight text-[var(--stage)] uppercase opacity-[0.22]">
              POLA
            </span>
          </div>

          {/* Ambient Glow */}
          <div className="pointer-events-none absolute h-80 w-80 -translate-y-4 rounded-full bg-[var(--stage-panel)] opacity-30 blur-3xl sm:h-[26rem] sm:w-[26rem]" />

          {/* Figurine Display Container */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/*
             * Box ratio has to track the source ratio, or the height is dead.
             *
             * These renders are 896x1200, ratio 0.747, and roughly a quarter of
             * each frame is transparent padding (alpha box 376x895), so only
             * ~74.6% of the painted height is figure.
             *
             * The previous desktop box was 320x480, ratio 0.667 — narrower than
             * the image, so `object-contain` went width-constrained and painted
             * 429px tall, never the 480px the class asked for. Visible figure:
             * 320px. At 420x560 (0.750) the height constrains again: 560px
             * painted, 418px of figure, +31%.
             *
             * Mobile stays a hair width-constrained at 0.744, which is fine here
             * because the 430px box height almost exactly matches the 429px the
             * 320px width produces. No dead space, no unused height.
             */}
            <div className="relative h-[430px] w-[320px] sm:h-[560px] sm:w-[420px]">
              <NextImage
                src={figureSrc}
                alt="Figurine Hasil Karakter LensaDiri"
                fill
                sizes="(max-width: 640px) 320px, 420px"
                priority
                draggable={false}
                className="object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)] select-none"
              />

              {/*
               * No attribute pucks are drawn over the figure. They were absolutely
               * positioned at 30-39% of the frame height, which is the face on
               * these renders, so the gem, medallion, and orbs stacked across the
               * eyes and mouth and read as damage rather than as equipment. The
               * same lenses are already stated exactly in the identity line.
               */}
            </div>

            {/* Grounding contact shadow only: the figure needs to sit on
                something, but the acrylic disk carried a label that repeated the
                cluster code already shown beside the identity line. */}
            {/* Widened with the figure: at the old w-48/w-56 the shadow was
                narrower than the feet standing on it. */}
            <div className="pointer-events-none relative -mt-6 flex h-8 w-[320px] items-start justify-center sm:w-[420px]">
              <div className="h-4 w-56 rounded-[100%] bg-[#1b1c1a]/16 blur-[5px] sm:w-72" />
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
          </div>

          {/* One heading for both states. The completeness signal lives in the
              badge above, so the title no longer forks on `isFullPodium`. */}
          <h1 className="font-display text-[clamp(34px,7vw,60px)] leading-[1.02] tracking-tight uppercase">
            HASIL LENSA
          </h1>

          {/* Card Identitas Pola Karakter */}
          <div className="bg-surface border-line rounded-[20px] border p-4 shadow-[0_10px_28px_rgb(27_28_26_/_0.08)] sm:p-5">
            <div className="text-steel mono-label mb-2.5">Identitas pola karakter</div>
            {/*
             * The line wraps instead of scrolling sideways. As a nowrap scroll
             * container it was clipped mid-token at the right edge, so the last
             * lens read as truncated data rather than as something to scroll.
             */}
            <div className="bg-surface-raised border-line rounded-[14px] border px-3 py-3 text-center font-mono text-sm leading-relaxed font-bold tracking-wider break-words sm:px-4 sm:text-xl">
              {identityString}
            </div>

            {/*
             * The same codes, one per row with a plain-language label. The single
             * line above stays authoritative and copyable; this list is what makes
             * it legible without a legend, and it wraps instead of overflowing on a
             * phone.
             */}
            {lensRows.length > 0 && (
              <dl className="border-line mt-4 grid gap-x-4 gap-y-0 border-t pt-1 sm:grid-cols-2">
                {lensRows.map((row) => (
                  <div
                    key={row.label}
                    className="border-line/70 flex items-baseline justify-between gap-3 border-b py-2.5 last:border-b-0 sm:border-b"
                  >
                    <dt className="text-ink-muted text-xs leading-snug">{row.label}</dt>
                    <dd className="text-ink font-mono text-sm font-bold tracking-wide">
                      {row.code}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/*
             * Where the notation comes from, closed by default.
             *
             * Native `<details>` rather than React state: it is keyboard operable,
             * findable by in-page search even while closed, and needs no motion, so
             * there is nothing for `prefers-reduced-motion` to suppress.
             *
             * Closed by default because the codes are the reveal here; the derivation
             * is for the reader who then asks "why these letters?". Open, it is
             * taller than the whole card and would push the actions below the fold.
             */}
            {codeLegend.length > 0 && (
              <details className="border-line mt-4 border-t pt-3">
                <summary className="focus-ring text-ink-muted hover:text-ink marker:text-steel cursor-pointer rounded-[10px] text-xs leading-snug">
                  Dari mana huruf-huruf ini?
                </summary>
                <p className="text-ink-muted mt-3 text-xs leading-relaxed">
                  Tiap bagian kode dihitung dari jawabanmu sendiri. Angka di bawah adalah skor 0-100
                  pada sisi yang diukur, bukan nilai benar atau salah.
                </p>
                <ol className="mt-3 space-y-3.5">
                  {codeLegend.map((segment) => (
                    <li className="bg-surface-raised rounded-[12px] p-3" key={segment.code}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <code className="text-ink font-mono text-sm font-bold tracking-wide">
                          {segment.code}
                        </code>
                        <span className="text-steel text-[11px] leading-snug">
                          {segment.sourceLabel}
                        </span>
                      </div>
                      <p className="text-ink-muted mt-1.5 text-xs leading-relaxed">
                        {segment.rule}
                      </p>
                      <ul className="mt-2.5 space-y-1.5">
                        {segment.characters.map((character, index) => (
                          <li
                            className="flex gap-2.5 text-xs leading-relaxed"
                            // Glyphs repeat inside a segment (SLUAI has two of
                            // some letters), so position is the stable key.
                            key={`${character.glyph}-${index}`}
                          >
                            <code className="text-ink w-8 shrink-0 font-mono font-bold">
                              {character.glyph}
                            </code>
                            <span className="text-ink-muted">
                              {character.constructLabel ? (
                                <span className="text-ink">{character.constructLabel}. </span>
                              ) : null}
                              {character.reason}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </details>
            )}
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
    </div>
  );
}

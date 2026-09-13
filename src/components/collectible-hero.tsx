"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type HeroFigure = {
  src: string;
  bg: string;
  panel: string;
  /** Dark on-stage ink. White on these light fills is only 2.2-2.5:1. */
  ink: string;
  code: string;
  group: "NT" | "NF" | "SJ" | "SP";
  /** Render variant. The gallery shows both so neither reads as the default. */
  variant: "laki" | "perempuan";
};

const STAGE = {
  SP: { bg: "#F4845F", panel: "#F79B7F", ink: "#6c1e02" },
  SJ: { bg: "#6BBF7A", panel: "#85CC92", ink: "#002109" },
  NF: { bg: "#E882B4", panel: "#ED9DC4", ink: "#681847" },
  NT: { bg: "#6EB5FF", panel: "#8DC4FF", ink: "#0b2f52" },
} as const;

/**
 * Landing carousel roster, grouped by cluster so the stage colour changes in
 * coherent runs instead of flickering between four hues.
 *
 * Every entry resolves to a `{CODE}-{variant}.png` render from the same batch,
 * so the carousel never mixes visual styles.
 */
type HeroSeed = readonly [code: string, group: "NT" | "NF" | "SJ" | "SP"];

const HERO_SEEDS: readonly HeroSeed[] = [
  ["INTJ", "NT"],
  ["INTP", "NT"],
  ["ENTJ", "NT"],
  ["ENTP", "NT"],
  ["INFJ", "NF"],
  ["INFP", "NF"],
  ["ENFJ", "NF"],
  ["ENFP", "NF"],
  ["ISTJ", "SJ"],
  ["ISFJ", "SJ"],
  ["ESTJ", "SJ"],
  ["ESFJ", "SJ"],
  ["ISTP", "SP"],
  ["ISFP", "SP"],
  ["ESTP", "SP"],
  ["ESFP", "SP"],
];

const HERO_VARIANTS = ["laki", "perempuan"] as const;

/**
 * Both renders of every type, 32 cards total. The variants are interleaved per
 * type rather than appended as a second lap, so a visitor who only swipes a few
 * cards still sees both and neither variant reads as the canonical one.
 */
export const HERO_FIGURES: HeroFigure[] = HERO_SEEDS.flatMap(([code, group]) =>
  HERO_VARIANTS.map((variant) => ({
    code,
    group,
    variant,
    bg: STAGE[group].bg,
    panel: STAGE[group].panel,
    ink: STAGE[group].ink,
    src: `/figurines/${code}-${variant}.png`,
  })),
);

function ArrowLeftIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}
function getIsMobileSnapshot() {
  return window.innerWidth < 640;
}
function getIsMobileServerSnapshot() {
  return false;
}

function subscribeToMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot() {
  return false;
}

export function CollectibleHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const isMobile = useSyncExternalStore(
    subscribeToResize,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot,
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  // Warm only the cards that can appear next. Preloading all 32 renders would
  // pull ~22 MB on first paint for images the visitor may never see.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const len = HERO_FIGURES.length;
    for (let step = -2; step <= 2; step += 1) {
      const figure = HERO_FIGURES[(activeIndex + step + len) % len];
      if (!figure) continue;
      const img = new window.Image();
      img.src = figure.src;
    }
  }, [activeIndex]);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (isAnimating) return;

      if (prefersReducedMotion) {
        setActiveIndex((prev) => (prev + dir + HERO_FIGURES.length) % HERO_FIGURES.length);
        return;
      }

      setIsAnimating(true);
      setActiveIndex((prev) => (prev + dir + HERO_FIGURES.length) % HERO_FIGURES.length);
      setTimeout(() => {
        setIsAnimating(false);
      }, 650);
    },
    [isAnimating, prefersReducedMotion],
  );

  const activeFigure = HERO_FIGURES[activeIndex] ?? HERO_FIGURES[0]!;

  /**
   * Signed ring distance from the active card, in the range
   * `[-len/2, +len/2]`. Negative is to the left, positive to the right, so a
   * 32-card roster keeps a symmetric neighbourhood instead of treating every
   * far index as "one step left".
   */
  const signedOffset = (index: number) => {
    const len = HERO_FIGURES.length;
    const raw = (index - activeIndex + len) % len;
    return raw > len / 2 ? raw - len : raw;
  };

  // Role resolution for index i
  const getRoleStyle = (index: number) => {
    const offset = signedOffset(index);
    const distance = Math.abs(offset);

    const transitionStyle = prefersReducedMotion
      ? "none"
      : "transform 650ms cubic-bezier(0.4, 0, 0.2, 1), filter 650ms cubic-bezier(0.4, 0, 0.2, 1), opacity 650ms cubic-bezier(0.4, 0, 0.2, 1), left 650ms cubic-bezier(0.4, 0, 0.2, 1), height 650ms cubic-bezier(0.4, 0, 0.2, 1), bottom 650ms cubic-bezier(0.4, 0, 0.2, 1)";

    const base = {
      transition: transitionStyle,
      willChange: "transform, filter, opacity, left",
    };

    // Center (active).
    //
    // Height is the only size lever here. An earlier revision enlarged the card
    // with `scale(1.68)` on top of `height: 92%`, but `transform-origin` is the
    // box centre, so the scaled box spanned roughly -31%..123% of the stage and
    // clipped the figurine's feet off-screen. Explicit height plus a bottom
    // offset keeps the whole render inside the stage and above the controls.
    if (distance === 0) {
      return {
        ...base,
        transform: "translateX(-50%)",
        filter: "blur(0px)",
        opacity: 1,
        zIndex: 20,
        left: "50%",
        height: isMobile ? "52%" : "74%",
        bottom: isMobile ? "26%" : "17%",
        // Clicking the active card is a no-op, but its transparent box is wide
        // enough to sit over both neighbours and swallow their clicks. Opting
        // out of hit-testing here is what makes the neighbour click target real.
        pointerEvents: "none" as const,
      };
    }

    // Immediate neighbours flank the active card.
    if (distance === 1) {
      const toRight = offset > 0;
      return {
        ...base,
        transform: "translateX(-50%) scale(1)",
        filter: "blur(2px)",
        opacity: 0.85,
        zIndex: 10,
        left: toRight ? (isMobile ? "80%" : "70%") : isMobile ? "20%" : "30%",
        height: isMobile ? "16%" : "28%",
        bottom: isMobile ? "32%" : "12%",
      };
    }

    // Second ring sits further out and dimmer, still readable as depth.
    if (distance === 2) {
      const toRight = offset > 0;
      return {
        ...base,
        transform: "translateX(-50%) scale(1)",
        filter: "blur(4px)",
        opacity: 0.5,
        zIndex: 5,
        left: toRight ? (isMobile ? "94%" : "84%") : isMobile ? "6%" : "16%",
        height: isMobile ? "13%" : "22%",
        bottom: isMobile ? "32%" : "12%",
      };
    }

    // Everything beyond the second ring parks off-stage and stops painting,
    // otherwise 32 cards pile up behind the active one.
    return {
      ...base,
      transform: "translateX(-50%) scale(0.75)",
      filter: "blur(6px)",
      opacity: 0,
      zIndex: 0,
      left: offset > 0 ? "108%" : "-8%",
      height: isMobile ? "12%" : "20%",
      bottom: isMobile ? "32%" : "12%",
      pointerEvents: "none" as const,
    };
  };

  return (
    <section
      aria-label="LensaDiri Collectible Hero"
      className="relative h-[100dvh] min-h-[620px] w-full overflow-hidden select-none"
      style={{
        backgroundColor: activeFigure.bg,
        transition: "background-color 650ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Accessible semantic heading required for a11y & smoke test */}
      <h1 className="sr-only">Kenali pola dirimu lewat banyak lensa.</h1>
      <span className="sr-only">LENSADIRI</span>

      {/* Grain overlay z-50, pointer-events none */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Ghost text z-2, top 18%, display face, clamp(90px, 28vw, 380px), uppercase, tracking -0.02em, content POLA */}
      <div
        aria-hidden="true"
        className="font-display pointer-events-none absolute top-[18%] left-1/2 z-[2] -translate-x-1/2 text-center leading-none tracking-[-0.02em] uppercase select-none"
        style={{
          fontSize: "clamp(90px, 28vw, 380px)",
          color: activeFigure.ink,
          opacity: 0.16,
          transition: "color 650ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        POLA
      </div>

      {/* Carousel z-3; each item aspect-ratio: 0.85 / 1 */}
      <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
        {HERO_FIGURES.map((figure, idx) => {
          const style = getRoleStyle(idx);
          return (
            <div
              // Both variants of a type share a `code`, so the key has to carry
              // the variant too or React sees 16 duplicate keys across 32 cards.
              key={`${figure.code}-${figure.variant}`}
              className="pointer-events-auto absolute cursor-pointer"
              style={{
                left: style.left,
                bottom: style.bottom,
                height: style.height,
                transform: style.transform,
                filter: style.filter,
                opacity: style.opacity,
                zIndex: style.zIndex,
                transition: style.transition,
                willChange: style.willChange,
                // Wider than the widest source render (ESFP is the broadest at
                // ~0.68) so `object-contain` is always height-constrained. At
                // the previous 0.6 the wide assets were width-constrained,
                // which is why height alone could not size the card and a large
                // scale factor was needed to compensate.
                aspectRatio: "0.85 / 1",
                // Off-stage cards are invisible and the active card is a no-op;
                // both opt out so only the navigable neighbours take clicks.
                pointerEvents: "pointerEvents" in style ? style.pointerEvents : undefined,
              }}
              onClick={() => {
                if (idx !== activeIndex && !isAnimating) {
                  navigate(signedOffset(idx) > 0 ? 1 : -1);
                }
              }}
            >
              <div className="relative h-full w-full">
                <NextImage
                  src={figure.src}
                  alt={`Figurine koleksi ${String(idx + 1).padStart(2, "0")}`}
                  fill
                  // The active card is painted at roughly 0.85 x its height, so
                  // the old 35vw declaration understated the real width and the
                  // browser picked a 384px variant for an ~890px box. These
                  // values track the painted width instead, which is what keeps
                  // the render off the upscale path.
                  sizes="(max-width: 640px) 88vw, 58vw"
                  // 100, not 90: below this the WebP encoder degrades the alpha
                  // channel and the stage colour bleeds through the eyes. Costs
                  // no extra bytes on these gradient-heavy renders.
                  quality={100}
                  draggable={false}
                  className="pointer-events-none object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)] filter select-none"
                  priority={idx === activeIndex}
                />
                {/* Contact shadow ellipse under feet */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-1/2 h-3.5 w-3/4 -translate-x-1/2 rounded-[100%] bg-[#1b1c1a]/22 blur-[3px]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/*
        Carousel controls flank the active figurine instead of stacking in the
        bottom-left corner. They sit at the stage's vertical midpoint, which is
        where the character's torso lands at both the mobile (52%) and desktop
        (74%) card heights, so the arrows read as attached to the figure.
      */}
      <div className="pointer-events-none absolute inset-x-3 top-1/2 z-40 flex -translate-y-1/2 items-center justify-between sm:inset-x-8">
        <button
          type="button"
          aria-label="Figurine sebelumnya"
          onClick={() => navigate(-1)}
          disabled={isAnimating}
          style={{ borderColor: activeFigure.ink, color: activeFigure.ink }}
          className="stage-control focus-ring pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 bg-transparent disabled:opacity-50 sm:h-16 sm:w-16"
        >
          <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          aria-label="Figurine berikutnya"
          onClick={() => navigate(1)}
          disabled={isAnimating}
          style={{ borderColor: activeFigure.ink, color: activeFigure.ink }}
          className="stage-control focus-ring pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 bg-transparent disabled:opacity-50 sm:h-16 sm:w-16"
        >
          <ArrowRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Bottom row: legal paths on the left, primary CTA on the right */}
      <div className="pointer-events-none absolute inset-x-6 bottom-6 z-40 flex items-end justify-between gap-4 sm:inset-x-10 sm:bottom-10">
        {/*
          The site footer never renders on the landing page and the header no
          longer carries a nav rail, so this is the only entry point to the
          privacy and limitation pages. It stays deliberately quiet, but it
          cannot be removed without orphaning those disclosures.
        */}
        <nav
          aria-label="Informasi dan kebijakan"
          className="pointer-events-auto flex flex-wrap items-center text-[10px] tracking-wide sm:text-xs"
          style={{ color: activeFigure.ink }}
        >
          {/*
            Each link is its own 44px target rather than bare inline text. At
            this type size the text box is only ~16px tall, which fails the
            minimum tap target the accessibility suite enforces.
          */}
          <Link
            href="/privacy"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 underline-offset-4 hover:underline"
          >
            Privasi
          </Link>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <Link
            href="/disclaimer"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 underline-offset-4 hover:underline"
          >
            Batasan
          </Link>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <Link
            href="/method"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm px-2 underline-offset-4 hover:underline"
          >
            Metode
          </Link>
        </nav>

        <Link
          href="/start"
          aria-label="MULAI — Mulai eksplorasi LensaDiri"
          className="focus-ring group font-display pointer-events-auto flex min-h-11 items-center gap-2 leading-none tracking-[-0.02em] uppercase transition-transform duration-200 hover:translate-x-1 sm:gap-3"
          style={{
            fontSize: "clamp(20px, 4vw, 56px)",
            color: activeFigure.ink,
          }}
        >
          <span>MULAI</span>
          <ArrowRightIcon className="h-6 w-6 transition-transform duration-200 group-hover:translate-x-1.5 sm:h-10 sm:w-10" />
        </Link>
      </div>
    </section>
  );
}

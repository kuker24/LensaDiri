"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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
 * The hue of the card the stage opens on.
 *
 * The effect below cannot cover the first paint: effects run after it, so until
 * hydration lands `body` falls back to the paper canvas while the stage box is
 * already coloured. Measured on a Pixel 5 viewport, the body sampled
 * rgb(251,249,245) at first paint and only reached the stage hue after hydration.
 * The gallery always opens on the same card, so this value is deterministic and
 * safe to render server-side; the effect then takes over for every later card.
 */
const INITIAL_STAGE_BG = STAGE.NT.bg;

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

/**
 * Painted-ink correction.
 *
 * Every roster render carries roughly a quarter of its frame as transparent
 * padding: the alpha bounding box of `INTJ-laki.png` is 376x895 inside a
 * 896x1200 frame, so only 74.6% of the card's height is figure. A card sized to
 * 74% of the stage therefore painted a figure at 55% of the stage, which is why
 * the hero read as too small even though the number looked generous.
 *
 * These heights are chosen against that fill, not against the visual result.
 */
const CARD_HEIGHT_DESKTOP = "92%";
const CARD_HEIGHT_MOBILE = "68%";

/** Velocity, in px/ms, above which a flick advances regardless of distance. */
const SWIPE_VELOCITY = 0.11;
/** Distance, in px, that advances the stage even from a slow drag. */
const SWIPE_DISTANCE = 56;

export function CollectibleHero() {
  const [activeIndex, setActiveIndex] = useState(0);

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

  /**
   * No animation lock.
   *
   * An earlier revision blocked input for the full 650ms transition because the
   * stage animated `left`, `height`, and `bottom`; interrupting a layout
   * animation mid-flight is what looks broken. The stage now animates only
   * `transform`, and CSS transitions retarget from their current value with
   * velocity preserved, so a rapid second click is smooth rather than a jump.
   *
   * Dropping the lock also removes a real cost: reaching card 20 of 32 took
   * twenty 650ms waits, roughly 13 seconds of ignored clicks.
   */
  const navigate = useCallback((dir: 1 | -1) => {
    setActiveIndex((prev) => (prev + dir + HERO_FIGURES.length) % HERO_FIGURES.length);
  }, []);

  // Arrow keys drive the stage. The test runner already binds these, so the
  // landing carousel was the only interactive surface ignoring them.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  /**
   * Pointer drag. A 32-card gallery on a phone invites a swipe, and until now
   * nothing happened. Velocity is checked alongside distance so a quick flick
   * counts even when the finger barely travels.
   */
  const dragRef = useRef<{ id: number; startX: number; startedAt: number } | null>(null);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    // Ignore a second finger once a drag owns the stage, otherwise switching
    // fingers mid-drag re-anchors the gesture and the stage jumps.
    if (dragRef.current) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = { id: event.pointerId, startX: event.clientX, startedAt: Date.now() };
    // Capture so the gesture survives the pointer leaving the element.
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      const travel = event.clientX - drag.startX;
      const elapsed = Math.max(1, Date.now() - drag.startedAt);
      const velocity = Math.abs(travel) / elapsed;
      if (Math.abs(travel) < SWIPE_DISTANCE && velocity < SWIPE_VELOCITY) return;

      // Dragging left pulls the next card in from the right.
      navigate(travel < 0 ? 1 : -1);
    },
    [navigate],
  );

  const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
  }, []);

  const activeFigure = HERO_FIGURES[activeIndex] ?? HERO_FIGURES[0]!;

  /**
   * Publish the active stage hue to the document canvas.
   *
   * The stage box is `100dvh`, but `body` used to resolve its floor against
   * `100vh`. On Chrome Android `100vh` is the large viewport, which stays tall
   * while browser UI is showing, so the body box outlived the stage and the
   * paper canvas painted a white strip beneath it. Measured on a Pixel 5
   * viewport: the exposed row sampled rgb(251,249,245), exactly
   * `--color-canvas`.
   *
   * Setting the variable on `documentElement` lets `html` and `body` inherit the
   * stage colour, which also stops the overscroll rubber-band flashing white.
   * `themeColor` in the root layout stays paper: it is a static export and
   * cannot follow a hue that changes per card.
   *
   * The cleanup matters. This is a landing-only surface, so unmounting must
   * restore the paper canvas rather than leave every later page tinted.
   */
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--stage-canvas", activeFigure.bg);
    return () => {
      root.style.removeProperty("--stage-canvas");
    };
  }, [activeFigure.bg]);

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

  /**
   * Tier resolution for index i.
   *
   * Every card shares one box — same `left`, `bottom`, and `height` — and the
   * tier is expressed purely as `transform` plus `opacity`. The previous
   * revision animated `left`, `height`, and `bottom`, which are layout
   * properties: each frame forced a reflow, across 32 positioned cards, on the
   * main thread. Transform and opacity are the only two properties the
   * compositor can animate without layout or paint.
   *
   * `transform-origin: bottom center` is what makes the shared box work. Scaling
   * about the bottom edge keeps every tier standing on the same floor line, so
   * the neighbours read as figures further back on one shelf rather than as
   * cards floating at their own heights.
   */
  const getRoleStyle = (index: number) => {
    const offset = signedOffset(index);
    const distance = Math.abs(offset);
    const direction = offset > 0 ? 1 : -1;

    const transitionStyle = prefersReducedMotion
      ? "none"
      : "transform var(--duration-stage) var(--ease-stage-out), opacity var(--duration-stage) var(--ease-stage-out)";

    // Blur is set per tier but never transitioned: animating a filter is
    // expensive, especially in Safari, and the depth cue is what has to read,
    // not the ramp between two blur radii.
    const base = {
      transition: transitionStyle,
      willChange: "transform, opacity",
      transformOrigin: "bottom center",
      left: "50%",
      bottom: isMobile ? "13%" : "5%",
      height: isMobile ? CARD_HEIGHT_MOBILE : CARD_HEIGHT_DESKTOP,
    };

    const shift = (vw: number) => `translate3d(calc(-50% + ${direction * vw}vw), 0, 0)`;

    if (distance === 0) {
      return {
        ...base,
        transform: "translate3d(-50%, 0, 0) scale(1)",
        filter: "blur(0px)",
        opacity: 1,
        zIndex: 20,
        // Clicking the active card is a no-op, but its transparent box is wide
        // enough to sit over both neighbours and swallow their clicks. Opting
        // out of hit-testing here is what makes the neighbour click target real.
        pointerEvents: "none" as const,
      };
    }

    if (distance === 1) {
      return {
        ...base,
        transform: `${shift(isMobile ? 30 : 21)} scale(${isMobile ? 0.3 : 0.34})`,
        filter: "blur(2px)",
        opacity: 0.85,
        zIndex: 10,
      };
    }

    if (distance === 2) {
      return {
        ...base,
        transform: `${shift(isMobile ? 44 : 34)} scale(${isMobile ? 0.24 : 0.26})`,
        filter: "blur(4px)",
        opacity: 0.5,
        zIndex: 5,
      };
    }

    // Everything beyond the second ring parks off-stage and stops painting,
    // otherwise 32 cards pile up behind the active one.
    return {
      ...base,
      transform: `${shift(isMobile ? 58 : 46)} scale(0.2)`,
      filter: "blur(6px)",
      opacity: 0,
      zIndex: 0,
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
      {/*
       * Carries the opening hue into the very first paint, which the effect above
       * cannot reach.
       *
       * `href` plus `precedence` is React's hoisting contract: the tag is lifted
       * into `<head>` and deduplicated. That placement is the point. Left in the
       * body it parses only when the stream reaches it, which is a race against
       * the first frame — measured failing, since at that frame the stage box
       * still has zero height and the whole viewport shows the canvas.
       *
       * The effect above writes an inline style on `documentElement`, which
       * outranks a stylesheet rule, so later cards still win. Cleanup there
       * removes the inline value and this rule takes over again, which is
       * harmless: leaving the landing unmounts the hoisted style with it.
       */}
      <style href="collectible-hero-stage-canvas" precedence="high">
        {`html{--stage-canvas:${INITIAL_STAGE_BG}}`}
      </style>

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

      {/*
        Carousel z-3. The drag gesture is bound on this wrapper rather than per
        card, so a swipe that starts on the active figure — the widest target and
        the one a thumb naturally lands on — still moves the stage.
      */}
      <div
        className="absolute inset-0 z-[3] touch-pan-y overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
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
                transformOrigin: style.transformOrigin,
                filter: style.filter,
                opacity: style.opacity,
                zIndex: style.zIndex,
                transition: style.transition,
                willChange: style.willChange,
                // Just above the source ratio (these renders are 896x1200, so
                // 0.747) which keeps `object-contain` height-constrained. Below
                // it the wide assets become width-constrained and the height
                // value stops having any effect on the painted figure.
                aspectRatio: "0.75 / 1",
                // Off-stage cards are invisible and the active card is a no-op;
                // both opt out so only the navigable neighbours take clicks.
                pointerEvents: "pointerEvents" in style ? style.pointerEvents : undefined,
              }}
              onClick={() => {
                if (idx !== activeIndex) {
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
        where the character's torso lands at both the mobile (68%) and desktop
        (92%) card heights, so the arrows read as attached to the figure.

        Neither control disables any more: the 650ms input lock is gone, so
        there is no window during which pressing them would do nothing.
      */}
      <div className="pointer-events-none absolute inset-x-3 top-1/2 z-40 flex -translate-y-1/2 items-center justify-between sm:inset-x-8">
        <button
          type="button"
          aria-label="Figurine sebelumnya"
          onClick={() => navigate(-1)}
          style={{ borderColor: activeFigure.ink, color: activeFigure.ink }}
          className="stage-control focus-ring pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 bg-transparent sm:h-16 sm:w-16"
        >
          <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
        <button
          type="button"
          aria-label="Figurine berikutnya"
          onClick={() => navigate(1)}
          style={{ borderColor: activeFigure.ink, color: activeFigure.ink }}
          className="stage-control focus-ring pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 bg-transparent sm:h-16 sm:w-16"
        >
          <ArrowRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/*
        Bottom row: the primary CTA alone.

        The quiet "Privasi · Batasan · Metode" row that used to sit on the left
        was removed by product decision. Those pages are still served and still
        linked from the site footer, but the footer does not render on `/`,
        `/start`, `/test`, or `/result`, so nothing on the journey itself points
        at them any more.
      */}
      <div className="pointer-events-none absolute inset-x-6 bottom-6 z-40 flex items-end justify-end gap-4 sm:inset-x-10 sm:bottom-10">
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

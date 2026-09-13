"use client";

import type { ReactNode } from "react";

export interface CollectiblePageHeroProps {
  badgeText: string;
  headline: ReactNode;
  subheadline: ReactNode;
  rightCard?: ReactNode;
  ghostText?: string;
  stageColor?: string;
  /** Dark on-stage ink. Defaults to the NF pair when a custom stage is passed. */
  stageInk?: string;
  className?: string;
}

export function CollectiblePageHero({
  badgeText,
  headline,
  subheadline,
  rightCard,
  ghostText = "LENSA",
  stageColor = "#E882B4",
  stageInk = "#681847",
  className = "",
}: CollectiblePageHeroProps) {
  return (
    <section
      className={`bg-surface border-line relative w-full overflow-hidden rounded-[24px] border p-6 shadow-[0_12px_36px_rgb(27_28_26_/_0.08)] sm:p-10 md:p-14 ${className}`}
      style={{ color: "var(--color-ink)" }}
    >
      {/* Stage colour lives in the ambient light, never behind body text:
          white on these light fills is only 2.2-2.5:1. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundColor: stageColor, opacity: 0.13 }}
      />

      {/* Giant ghost display watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 items-center justify-center select-none"
      >
        <span
          className="font-display text-[clamp(100px,22vw,300px)] leading-none font-black tracking-tight uppercase opacity-25"
          style={{ color: stageColor }}
        >
          {ghostText}
        </span>
      </div>

      {/* Content Grid (Left Story & Right Card) */}
      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 font-mono text-xs font-bold tracking-wider uppercase"
            style={{ backgroundColor: stageColor, color: stageInk }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {badgeText}
          </span>

          <div className="font-sans">{headline}</div>

          <div className="text-ink-muted max-w-xl">{subheadline}</div>
        </div>

        {rightCard ? <div className="lg:col-span-5">{rightCard}</div> : null}
      </div>
    </section>
  );
}

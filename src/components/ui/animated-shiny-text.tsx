import { type ComponentPropsWithoutRef, type CSSProperties, type FC } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
}

/**
 * Soft Product micro-label shine — frost glare on muted ink.
 * Prefer for small labels only; not body copy or CTAs.
 */
export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 120,
  ...props
}) => {
  return (
    <span
      style={
        {
          "--shiny-width": `${shimmerWidth}px`,
        } as CSSProperties
      }
      className={cn(
        /* Higher resting contrast for dark film-strip hero */
        "inline-block max-w-md text-ink/90",
        "animate-shiny-text bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]",
        "bg-linear-to-r from-ink/55 via-frost via-50% to-ink/55",
        "motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

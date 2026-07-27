import { type ComponentPropsWithoutRef, type FC } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  /** Kept for API compatibility with Magic UI; unused after anti-slop retheme. */
  shimmerWidth?: number;
}

/**
 * Soft Product micro-label — solid frost ink (no gradient-text / bg-clip-text).
 * Prefer for small labels only; not body copy or CTAs.
 */
export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth: _unusedShimmerWidth = 0,
  ...props
}) => {
  void _unusedShimmerWidth;
  return (
    <span className={cn("text-ink/90 inline-block max-w-md", className)} {...props}>
      {children}
    </span>
  );
};

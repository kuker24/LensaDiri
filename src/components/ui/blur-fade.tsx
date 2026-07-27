"use client";

import { useRef, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  type MotionProps,
  type UseInViewOptions,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

type MarginType = UseInViewOptions["margin"];

interface BlurFadeProps extends MotionProps {
  children: ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  /** When true, wait until the element is in view before revealing. */
  inView?: boolean;
  inViewMargin?: MarginType;
  blur?: string;
}

const getFilter = (v: Variants[string]) => (typeof v === "function" ? undefined : v.filter);

/**
 * Soft Product scroll/mount reveal. Respects prefers-reduced-motion.
 * Pass `inView` for section reveals; omit for mount-only hero staggers.
 */
export function BlurFade({
  children,
  className,
  variant,
  duration = 0.45,
  delay = 0,
  offset = 10,
  direction = "up",
  inView = false,
  inViewMargin = "-8% 0px -8% 0px",
  blur = "6px",
  ...props
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const reduceMotion = usePrefersReducedMotion();
  const shouldAnimate = !reduceMotion && (!inView || inViewResult);

  const defaultVariants: Variants = {
    hidden: {
      [direction === "left" || direction === "right" ? "x" : "y"]:
        direction === "right" || direction === "down" ? -offset : offset,
      opacity: 0,
      filter: `blur(${blur})`,
    },
    visible: {
      [direction === "left" || direction === "right" ? "x" : "y"]: 0,
      opacity: 1,
      filter: "blur(0px)",
    },
  };
  const combinedVariants = variant ?? defaultVariants;

  const hiddenFilter = getFilter(combinedVariants.hidden);
  const visibleFilter = getFilter(combinedVariants.visible);
  const shouldTransitionFilter =
    hiddenFilter != null && visibleFilter != null && hiddenFilter !== visibleFilter;

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={shouldAnimate ? "visible" : "hidden"}
        exit="hidden"
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: [0.23, 1, 0.32, 1],
          ...(shouldTransitionFilter ? { filter: { duration } } : {}),
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

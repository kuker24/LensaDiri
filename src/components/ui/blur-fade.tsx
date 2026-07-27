"use client";

import { useRef, type ReactNode } from "react";
import {
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
  /** When true, reveal motion waits until the element is in view. */
  inView?: boolean;
  inViewMargin?: MarginType;
  /**
   * Optional blur on the pre-reveal frame. Keep light — content must stay readable.
   * Empty string disables blur transition.
   */
  blur?: string;
}

/**
 * Soft Product scroll/mount reveal — content-first.
 * Never gates copy at opacity 0 (full-page capture, background tabs, late IO).
 * Motion is transform (+ optional soft blur); reduced-motion is static.
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
  blur = "",
  ...props
}: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const reduceMotion = usePrefersReducedMotion();
  const shouldAnimate = !reduceMotion && (!inView || inViewResult);

  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const from = direction === "right" || direction === "down" ? -offset : offset;

  const defaultVariants: Variants = {
    // opacity stays 1 — readable even before the observer fires
    hidden: {
      [axis]: from,
      opacity: 1,
      ...(blur ? { filter: `blur(${blur})` } : {}),
    },
    visible: {
      [axis]: 0,
      opacity: 1,
      ...(blur ? { filter: "blur(0px)" } : {}),
    },
  };
  const combinedVariants = variant ?? defaultVariants;

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      variants={combinedVariants}
      transition={{
        delay: 0.04 + delay,
        duration,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

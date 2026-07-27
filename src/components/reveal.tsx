"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

/**
 * Progressive enhancement reveal: content stays visible by default.
 * Motion only activates after mount when reduced-motion is off.
 */
export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      element.dataset.inView = "true";
      return;
    }

    element.dataset.motion = "ready";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        element.dataset.inView = "true";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.14 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const style =
    delayMs > 0 ? ({ ["--reveal-delay" as string]: `${delayMs}ms` } as CSSProperties) : undefined;

  return (
    <div className={cn("reveal", className)} ref={ref} style={style}>
      {children}
    </div>
  );
}

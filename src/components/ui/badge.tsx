import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "lens" | "aperture" | "success" | "warning" | "danger";

/* Paper theme: evidence tiers read by ink weight, not glow. A is the most
   emphatic (solid line + full ink), B/C softer, experimental quietest. */
const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-line bg-surface-raised text-ink-muted",
  lens: "border-line bg-surface-raised text-ink-soft",
  aperture: "border-line-strong bg-iris-wash text-ink",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/40 bg-warning-soft text-warning",
  danger: "border-danger/25 bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-0.5 font-mono text-[0.68rem] font-medium tracking-[-0.01em] uppercase",
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

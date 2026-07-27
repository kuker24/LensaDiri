import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "lens" | "aperture" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  /* Soft Product: monochrome first; success/warning/danger only for functional status */
  neutral: "border-white/18 bg-white/[0.04] text-ink-muted",
  lens: "border-frost/30 bg-white/[0.06] text-frost",
  aperture: "border-frost/50 bg-white/[0.1] text-ink",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger-soft bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-0.5 font-mono text-[0.65rem] font-medium tracking-[-0.02em]",
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

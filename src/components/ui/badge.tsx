import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "lens" | "aperture" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-line bg-mist text-ink-muted",
  lens: "border-lens/35 bg-lens-soft text-aperture",
  aperture: "border-aperture/25 bg-aperture-soft text-aperture",
  success: "border-success/30 bg-success-soft text-success",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger-soft bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] font-medium tracking-[0.08em] uppercase",
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

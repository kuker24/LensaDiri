import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "lens" | "aperture" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-line bg-mist text-ink-muted",
  lens: "border-lens-soft bg-lens-soft text-lens-strong",
  aperture: "border-aperture-soft bg-aperture-soft text-[#88421b]",
  success: "border-line bg-canvas text-success",
  warning: "border-line bg-canvas text-warning",
  danger: "border-danger-soft bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 text-xs font-medium tracking-wide uppercase",
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

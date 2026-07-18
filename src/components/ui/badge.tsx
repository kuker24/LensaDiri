import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "lens" | "aperture" | "success" | "warning" | "danger";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "border-line bg-mist text-ink-muted",
  lens: "border-[#ddd6fe] bg-[#f5f3ff] text-[#5b21b6]",
  aperture: "border-[#bdeee5] bg-aperture-soft text-[#166b61]",
  success: "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]",
  warning: "border-[#fde68a] bg-[#fffbeb] text-[#78350f]",
  danger: "border-danger-soft bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide uppercase",
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

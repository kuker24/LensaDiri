import { cn } from "@/lib/cn";

export function Progress({
  value,
  max = 100,
  label,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div
        aria-label={ariaLabel}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={Math.round(value)}
        className="h-px w-full overflow-hidden bg-white/20"
        role="progressbar"
      >
        <div
          className="bg-frost h-full w-full origin-left motion-reduce:transition-none"
          style={{
            transform: `scaleX(${percent / 100})`,
            transition: "transform var(--duration-ui) var(--ease-out)",
          }}
        />
      </div>
      {label ? <p className="text-ink-muted mt-1.5 text-xs tabular-nums">{label}</p> : null}
    </div>
  );
}

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
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-lens transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {label ? <p className="tabular-nums mt-1.5 text-xs text-ink-muted">{label}</p> : null}
    </div>
  );
}

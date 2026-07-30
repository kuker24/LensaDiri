import { bipolarResultAxes, scoreReading } from "@/lib/report/result-presentation";

export function ResultScoreIndicator({
  constructKey,
  label,
  value,
}: {
  constructKey: string;
  label: string;
  value: number;
}) {
  const rounded = Math.round(value);
  const axis = bipolarResultAxes[constructKey];

  if (axis) {
    return (
      <div
        aria-label={`${label}: posisi jawaban ${rounded} dari 100, dari ${axis[0]} menuju ${axis[1]}`}
        role="img"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-normal">{label}</h3>
          <span className="text-ink-muted font-mono text-xs tabular-nums">{rounded} dari 100</span>
        </div>
        <div className="relative mt-3 h-2 rounded-full bg-white/12">
          <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-white/20" />
          <span className="absolute top-1/2 left-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-white/25" />
          <span className="absolute top-1/2 right-0 h-3 w-px -translate-y-1/2 bg-white/20" />
          <span
            className="bg-frost absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black"
            style={{ left: `${Math.min(100, Math.max(0, value))}%` }}
          />
        </div>
        <div className="text-ink-muted mt-2 flex justify-between gap-4 text-[0.7rem] leading-5">
          <span>{axis[0]}</span>
          <span className="text-right">{axis[1]}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-normal">{label}</h3>
        <span className="text-ink-muted font-mono text-xs tabular-nums">
          {scoreReading(value)} · {rounded} dari 100
        </span>
      </div>
      <div
        aria-label={`${label}: ${scoreReading(value)}, ${rounded} dari 100`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={rounded}
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/12"
        role="progressbar"
      >
        <div
          className="bg-frost h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

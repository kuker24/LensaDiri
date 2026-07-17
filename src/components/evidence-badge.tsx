type EvidenceTier = "A" | "B" | "C" | "Experimental";

const styles: Record<EvidenceTier, string> = {
  A: "border-emerald-200 bg-emerald-50 text-emerald-800",
  B: "border-violet-200 bg-violet-50 text-violet-800",
  C: "border-amber-200 bg-amber-50 text-amber-900",
  Experimental: "border-slate-200 bg-slate-50 text-slate-700",
};

const labels: Record<EvidenceTier, string> = {
  A: "Evidence Tier A",
  B: "Evidence Tier B",
  C: "Evidence Tier C",
  Experimental: "Experimental",
};

export function EvidenceBadge({ tier }: { tier: EvidenceTier }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[tier]}`}
    >
      {labels[tier]}
    </span>
  );
}

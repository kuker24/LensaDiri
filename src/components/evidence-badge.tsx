import { Badge } from "@/components/ui/badge";

type EvidenceTier = "A" | "B" | "C" | "Experimental";

const tones: Record<EvidenceTier, "success" | "lens" | "warning" | "neutral"> = {
  A: "success",
  B: "lens",
  C: "warning",
  Experimental: "neutral",
};

const labels: Record<EvidenceTier, string> = {
  A: "Evidence Tier A",
  B: "Evidence Tier B",
  C: "Evidence Tier C",
  Experimental: "Experimental",
};

export function EvidenceBadge({ tier }: { tier: EvidenceTier }) {
  return <Badge tone={tones[tier]}>{labels[tier]}</Badge>;
}

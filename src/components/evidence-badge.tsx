import { Badge } from "@/components/ui/badge";

type EvidenceTier = "A" | "B" | "C" | "Experimental";

/**
 * Soft Product monochrome hierarchy — no green/amber success-warning colors.
 * A strongest frost, B/C softer frost, Experimental quiet mist.
 */
const tones: Record<EvidenceTier, "aperture" | "lens" | "neutral"> = {
  A: "aperture",
  B: "lens",
  C: "lens",
  Experimental: "neutral",
};

const labels: Record<EvidenceTier, string> = {
  A: "Riset Teruji",
  B: "Reflektif",
  C: "Eksploratif",
  Experimental: "Eksperimental",
};

export function EvidenceBadge({ tier }: { tier: EvidenceTier }) {
  return <Badge tone={tones[tier]}>{labels[tier]}</Badge>;
}

import "server-only";

import { withDeadline } from "@/lib/async/with-deadline";
import { publicAssessmentCatalog } from "@/lib/assessment/public-catalog";
import { isFeatureEnabledBatch } from "@/server/repositories/catalog";

const FLAG_DEADLINE_MS = 500;
const RELEASE_FLAGS = {
  FEATURE_COMPLEX_MODE: true,
  FEATURE_MODULAR_COMPOSER: true,
};
let lastKnownFlags: Readonly<Record<string, boolean>> = RELEASE_FLAGS;
let pendingFlagRead: Promise<Readonly<Record<string, boolean>>> | undefined;

function readReleaseFlags(): Promise<Readonly<Record<string, boolean>>> {
  if (pendingFlagRead) return pendingFlagRead;

  const read = isFeatureEnabledBatch(["FEATURE_MODULAR_COMPOSER", "FEATURE_COMPLEX_MODE"]);
  const tracked = read.then(
    (flags) => {
      if (pendingFlagRead === tracked) pendingFlagRead = undefined;
      lastKnownFlags = flags;
      return flags;
    },
    (error: unknown) => {
      if (pendingFlagRead === tracked) pendingFlagRead = undefined;
      throw error;
    },
  );
  pendingFlagRead = tracked;
  return tracked;
}

function getReleaseFlags(): Promise<Readonly<Record<string, boolean>>> {
  return withDeadline(readReleaseFlags(), FLAG_DEADLINE_MS).catch(() => lastKnownFlags);
}

export async function getPublicAssessmentCatalog() {
  const flags = await getReleaseFlags();
  if (!flags.FEATURE_MODULAR_COMPOSER) return null;
  if (flags.FEATURE_COMPLEX_MODE) return publicAssessmentCatalog;

  return {
    ...publicAssessmentCatalog,
    combos: publicAssessmentCatalog.combos.filter((combo) => combo.recommendedMode !== "deep"),
    modes: publicAssessmentCatalog.modes.map((mode) =>
      mode.internalMode === "deep" ? { ...mode, isSelectable: false } : mode,
    ),
  };
}

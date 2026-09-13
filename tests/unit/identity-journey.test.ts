import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCollectibleIdentity,
  getNextJourneyModule,
  identityJourneyDeepQuota,
  identityJourneyScoringVersions,
  identityJourneyStandardQuota,
  resolveJourneySteps,
} from "@/lib/assessment/identity-journey";
import type { IndependentModuleResult } from "@/lib/scoring/modules/types";

function moduleResult(
  moduleKey: string,
  summary: Record<string, unknown>,
): IndependentModuleResult {
  return { moduleKey, summary } as IndependentModuleResult;
}

describe("identity journey", () => {
  it("requires type_16 first and unlocks exactly one unfinished step", () => {
    expect(getNextJourneyModule([])).toBe("type_16");
    expect(getNextJourneyModule(["type_16"])).toBe("enneagram");
    expect(resolveJourneySteps(["type_16"]).map((step) => step.status)).toEqual([
      "completed",
      "available",
      "locked",
      "locked",
      "locked",
    ]);
  });

  it("builds partial identity without placeholders", () => {
    expect(
      buildCollectibleIdentity([moduleResult("type_16", { primaryType: "ISFJ" })]),
    ).toMatchObject({ complete: false, group: "SJ", line: "ISFJ · SJ", type16: "ISFJ" });
    expect(buildCollectibleIdentity([]).line).toBe("");
  });

  it("uses canonical ordering and only marks all five completed as full", () => {
    const identity = buildCollectibleIdentity([
      moduleResult("psychosophy", { positionCode: "L¹V²E³F⁴" }),
      moduleResult("trait_profile", { sloanCode: "RCUAN" }),
      moduleResult("socionics_communication", { primaryType: "SEI" }),
      moduleResult("enneagram", { compactCode: "sx964" }),
      moduleResult("type_16", { primaryType: "ISFJ" }),
    ]);
    expect(identity.complete).toBe(true);
    expect(identity.line).toBe("ISFJ sx964 SEI RCUAN L¹V²E³F⁴ SJ");
  });

  it("pins journey quota and scoring versions to the migration that ships them", () => {
    const migration = readFileSync(
      resolve(
        import.meta.dirname,
        "../../supabase/migrations/202609120002_identity_journey_scoring.sql",
      ),
      "utf8",
    );

    for (const [moduleKey, scoringVersion] of Object.entries(identityJourneyScoringVersions)) {
      expect(migration).toContain(`'${scoringVersion}'`);

      const versionIndex = migration.indexOf(`'${scoringVersion}'`);
      const config = migration.slice(versionIndex);
      const quotaMatch = /"standardQuota":(\d+)/u.exec(config);
      expect(
        Number(quotaMatch?.[1]),
        `${moduleKey} standardQuota must match the migration composer config`,
      ).toBe(identityJourneyStandardQuota[moduleKey as keyof typeof identityJourneyStandardQuota]);

      // The combined single sitting runs in Complex mode, so its quota is the
      // deep one from the very same versions.
      const deepMatch = /"deepQuota":(\d+)/u.exec(config);
      expect(
        Number(deepMatch?.[1]),
        `${moduleKey} deepQuota must match the migration composer config`,
      ).toBe(identityJourneyDeepQuota[moduleKey as keyof typeof identityJourneyDeepQuota]);
    }
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listAdminScoringRegistry, toAdminAuditMetadata } from "@/server/repositories/admin-reads";

describe("admin read DTOs", () => {
  it("allowlists audit metadata and drops sensitive or unknown keys", () => {
    expect(
      toAdminAuditMetadata({
        outcome: "completed",
        source: "dashboard",
        reason: "invalid_credentials",
        email: "must-not-appear@example.com",
        token: "raw-token",
        password: "secret",
        ip: "1.2.3.4",
        nested: { a: 1 },
        empty: "",
        long: "x".repeat(201),
      }),
    ).toEqual({
      outcome: "completed",
      reason: "invalid_credentials",
      source: "dashboard",
    });
    expect(toAdminAuditMetadata(null)).toEqual({});
    expect(toAdminAuditMetadata("string")).toEqual({});
  });

  it("lists scoring registry from code without inventing modules", () => {
    const rows = listAdminScoringRegistry();
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(rows.every((row) => row.moduleKey && row.scoringVersion)).toBe(true);
    // Every dispatchable version must be visible, including additive journey versions.
    expect(
      rows.filter((row) => row.moduleKey === "trait_profile").map((row) => row.scoringVersion),
    ).toEqual(["trait-profile-journey-1", "trait-profile-modular-1"]);
    expect(rows).toContainEqual({
      moduleKey: "enneagram",
      scoringVersion: "enneagram-journey-score-1",
    });
    expect(rows).toContainEqual({
      moduleKey: "socionics_communication",
      scoringVersion: "socionics-type-score-1",
    });
    expect(rows).toContainEqual({
      moduleKey: "psychosophy",
      scoringVersion: "psychosophy-journey-score-1",
    });
    // No duplicate registrations.
    const pairs = rows.map((row) => `${row.moduleKey}@${row.scoringVersion}`);
    expect(new Set(pairs).size).toBe(pairs.length);
    const keys = rows.map((row) => row.moduleKey);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });
});

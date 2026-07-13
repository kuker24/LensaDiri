import { describe, expect, it } from "vitest";

import {
  type AssessmentModeProfile,
  type AssessmentModuleDefinition,
  type ComboPresetDefinition,
  getPublicModeName,
  validateAssessmentSelection,
} from "@/lib/assessment/catalog";
import { estimateAssessment, provisionalPrecisionDisclaimer } from "@/lib/assessment/estimate";

const modules: readonly AssessmentModuleDefinition[] = [
  {
    category: "trait",
    defaultOrder: 10,
    description: "Trait",
    evidenceTier: "A",
    isExperimental: false,
    isSelectable: true,
    key: "trait_profile",
    minimumAge: 13,
    modeQuota: { deep: 60, quick: 30, standard: 45 },
    publicName: "Profil Trait",
    status: "active",
    version: "mvp-1",
  },
  {
    category: "typology",
    defaultOrder: 20,
    description: "Type",
    evidenceTier: "B",
    isExperimental: false,
    isSelectable: true,
    key: "type_16",
    minimumAge: 13,
    modeQuota: { deep: 80, quick: 35, standard: 55 },
    publicName: "16-Type",
    status: "published",
    version: "1",
  },
  {
    category: "motivation",
    defaultOrder: 30,
    description: "Motivation",
    evidenceTier: "B",
    isExperimental: false,
    isSelectable: true,
    key: "enneagram",
    minimumAge: 15,
    modeQuota: { deep: 90, quick: 40, standard: 65 },
    publicName: "Motivasi",
    status: "published",
    version: "1",
  },
  {
    category: "experimental",
    defaultOrder: 40,
    description: "Experimental",
    evidenceTier: "EXPERIMENTAL",
    isExperimental: true,
    isSelectable: true,
    key: "psychosophy",
    minimumAge: 18,
    modeQuota: { deep: 40, quick: 20, standard: 30 },
    publicName: "Psychosophy",
    status: "experimental",
    version: "pilot-1",
  },
  {
    category: "career",
    defaultOrder: 50,
    description: "Not ready",
    evidenceTier: "B",
    isExperimental: false,
    isSelectable: false,
    key: "riasec",
    minimumAge: 15,
    modeQuota: { deep: 50, quick: 20, standard: 35 },
    publicName: "RIASEC",
    status: "draft",
    version: null,
  },
];

const presets: readonly ComboPresetDefinition[] = [
  {
    description: "Core",
    isFullSpectrum: false,
    key: "core",
    moduleKeys: ["trait_profile", "type_16"],
    publicName: "Core",
    recommendedMode: "standard",
    status: "published",
  },
  {
    description: "All",
    isFullSpectrum: true,
    key: "all",
    moduleKeys: ["trait_profile", "type_16", "enneagram"],
    publicName: "All",
    recommendedMode: "deep",
    status: "published",
  },
];

const modeProfiles: readonly AssessmentModeProfile[] = [
  {
    description: "Quick",
    internalMode: "quick",
    isSelectable: true,
    maxItemsPerSegment: 120,
    provisionalPrecision: { max: 70, min: 60 },
    publicName: "Quick",
    secondsPerItem: 12,
    singleModuleItems: { max: 40, min: 24 },
    targetItems: { max: 60, min: 50 },
  },
  {
    description: "Normal",
    internalMode: "standard",
    isSelectable: true,
    maxItemsPerSegment: 120,
    provisionalPrecision: { max: 85, min: 75 },
    publicName: "Normal",
    secondsPerItem: 12,
    singleModuleItems: { max: 70, min: 40 },
    targetItems: { max: 90, min: 80 },
  },
  {
    description: "Complex",
    internalMode: "deep",
    isSelectable: true,
    maxItemsPerSegment: 60,
    provisionalPrecision: { max: 92, min: 85 },
    publicName: "Complex",
    secondsPerItem: 15,
    singleModuleItems: { max: 100, min: 60 },
    targetItems: { max: 120, min: 100 },
  },
];

describe("modular assessment catalog", () => {
  it("maps compatibility mode names", () => {
    expect(getPublicModeName("quick")).toBe("Quick");
    expect(getPublicModeName("standard")).toBe("Normal");
    expect(getPublicModeName("deep")).toBe("Complex");
  });

  it("validates single, preset, full-spectrum, age, and experimental boundaries", () => {
    expect(
      validateAssessmentSelection(
        {
          age: 16,
          experimentalAcknowledged: false,
          mode: "quick",
          moduleKeys: ["type_16"],
          presetKey: null,
          selectionType: "single",
        },
        modules,
        presets,
      ),
    ).toMatchObject({ valid: true });

    expect(
      validateAssessmentSelection(
        {
          age: 16,
          experimentalAcknowledged: false,
          mode: "standard",
          moduleKeys: ["trait_profile", "type_16"],
          presetKey: "core",
          selectionType: "preset_combo",
        },
        modules,
        presets,
      ),
    ).toMatchObject({ preset: { key: "core" }, valid: true });

    expect(
      validateAssessmentSelection(
        {
          age: 16,
          experimentalAcknowledged: false,
          mode: "deep",
          moduleKeys: ["trait_profile", "type_16", "enneagram"],
          presetKey: "all",
          selectionType: "full_spectrum",
        },
        modules,
        presets,
      ),
    ).toMatchObject({ valid: true });

    expect(
      validateAssessmentSelection(
        {
          age: 17,
          experimentalAcknowledged: true,
          mode: "quick",
          moduleKeys: ["psychosophy"],
          presetKey: null,
          selectionType: "single",
        },
        modules,
        presets,
      ),
    ).toEqual({ code: "age_restricted", valid: false });

    expect(
      validateAssessmentSelection(
        {
          age: 20,
          experimentalAcknowledged: false,
          mode: "quick",
          moduleKeys: ["psychosophy"],
          presetKey: null,
          selectionType: "single",
        },
        modules,
        presets,
      ),
    ).toEqual({ code: "experimental_acknowledgment_required", valid: false });

    expect(
      validateAssessmentSelection(
        {
          age: 20,
          experimentalAcknowledged: true,
          mode: "quick",
          moduleKeys: ["riasec"],
          presetKey: null,
          selectionType: "single",
        },
        modules,
        presets,
      ),
    ).toEqual({ code: "module_unavailable", valid: false });
  });
});

describe("assessment estimate", () => {
  it("uses single-module quota instead of forcing package targets", () => {
    const result = estimateAssessment(
      {
        age: 16,
        experimentalAcknowledged: false,
        mode: "quick",
        moduleKeys: ["type_16"],
        presetKey: null,
        selectionType: "single",
      },
      modules,
      presets,
      modeProfiles,
    );

    expect(result).toEqual({
      estimate: expect.objectContaining({
        estimatedMinutes: 7,
        itemCount: 35,
        precision: null,
        publicMode: "Quick",
        segmentPlan: [{ endItem: 35, itemCount: 35, segmentIndex: 1, startItem: 1 }],
      }),
      success: true,
    });
  });

  it("clamps combo estimates and allocates deterministically", () => {
    const input = {
      age: 18,
      experimentalAcknowledged: false,
      mode: "standard" as const,
      moduleKeys: ["enneagram", "type_16", "trait_profile"],
      presetKey: null,
      selectionType: "custom_combo" as const,
    };
    const first = estimateAssessment(input, modules, presets, modeProfiles, {
      provisionalPrecisionEnabled: true,
    });
    const second = estimateAssessment(input, modules, presets, modeProfiles, {
      provisionalPrecisionEnabled: true,
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      estimate: {
        disclaimer: provisionalPrecisionDisclaimer,
        estimatedMinutes: 18,
        itemCount: 90,
        moduleAllocation: [
          { itemCount: 25, moduleKey: "trait_profile" },
          { itemCount: 30, moduleKey: "type_16" },
          { itemCount: 35, moduleKey: "enneagram" },
        ],
        precision: { max: 85, min: 75 },
        publicMode: "Normal",
      },
      success: true,
    });
  });

  it("segments Complex without exceeding cap", () => {
    const result = estimateAssessment(
      {
        age: 18,
        experimentalAcknowledged: false,
        mode: "deep",
        moduleKeys: ["trait_profile", "type_16", "enneagram"],
        presetKey: "all",
        selectionType: "full_spectrum",
      },
      modules,
      presets,
      modeProfiles,
    );

    expect(result).toMatchObject({
      estimate: {
        itemCount: 120,
        segmentPlan: [
          { itemCount: 60, segmentIndex: 1 },
          { itemCount: 60, segmentIndex: 2 },
        ],
      },
      success: true,
    });
  });
});

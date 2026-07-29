import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ModularReviewForm } from "@/components/modular-review-form";
import { AuthApiError } from "@/lib/auth/client";

const selection = {
  age: 18,
  experimentalAcknowledged: false,
  mode: "deep" as const,
  moduleKeys: ["trait_profile", "type_16"],
  presetKey: null,
  selectionType: "custom_combo" as const,
};

const mocks = vi.hoisted(() => ({
  estimate: vi.fn(),
  getCatalog: vi.fn(),
  loadSelection: vi.fn(),
  push: vi.fn(),
  start: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/assessment/client", () => ({
  estimateModularAssessment: mocks.estimate,
  getAssessmentCatalog: mocks.getCatalog,
  startModularAssessment: mocks.start,
}));
vi.mock("@/lib/assessment/selection-storage", () => ({
  loadAssessmentSelection: mocks.loadSelection,
}));

beforeEach(() => {
  mocks.estimate.mockReset().mockResolvedValue({
    disclaimer: "Estimasi reflektif.",
    estimatedMinutes: 24,
    itemCount: 120,
    mode: "deep",
    moduleAllocation: { trait_profile: 60, type_16: 60 },
    precision: null,
    publicMode: "Complex",
    segmentPlan: [60, 60],
    selectionType: "custom_combo",
  });
  mocks.getCatalog.mockReset().mockResolvedValue({
    modes: [],
    modules: [
      { key: "trait_profile", publicName: "Profil Trait" },
      { key: "type_16", publicName: "16-Type" },
    ],
  });
  mocks.loadSelection.mockReset().mockReturnValue(selection);
  mocks.push.mockReset();
  mocks.start.mockReset().mockResolvedValue("assessment-token");
});

afterEach(cleanup);

describe("ModularReviewForm", () => {
  test("memerlukan estimate server dan consent sebelum start", async () => {
    render(<ModularReviewForm />);

    expect(await screen.findByText("120 pertanyaan")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    const start = screen.getByRole("button", { name: "Mulai asesmen" });
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /setuju jawabanku diproses/u }));
    expect(start).toBeEnabled();
    fireEvent.click(start);

    await vi.waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/test/assessment-token"));
  });

  test("menampilkan alasan kapasitas dari estimate server", async () => {
    mocks.estimate.mockRejectedValueOnce(new AuthApiError("coverage_unavailable"));
    render(<ModularReviewForm />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kombinasi ini melebihi kapasitas kedalaman yang dipilih.",
    );
    expect(screen.getByRole("button", { name: "Mulai asesmen" })).toBeDisabled();
  });

  test("mempertahankan pesan start yang spesifik", async () => {
    mocks.start.mockRejectedValueOnce(new AuthApiError("mode_unavailable"));
    render(<ModularReviewForm />);

    await screen.findByText("120 pertanyaan");
    fireEvent.click(screen.getByRole("checkbox", { name: /setuju jawabanku diproses/u }));
    fireEvent.click(screen.getByRole("button", { name: "Mulai asesmen" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Kedalaman ini belum tersedia.");
  });
});

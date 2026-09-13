import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LensAttachPicker } from "@/components/lens-attach-picker";

const mocks = vi.hoisted(() => ({
  continueIdentityJourney: vi.fn(),
  getIdentityJourney: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/assessment/client", () => ({
  continueIdentityJourney: mocks.continueIdentityJourney,
  getIdentityJourney: mocks.getIdentityJourney,
}));

const journey = {
  artifacts: [{ moduleKey: "type_16", summary: { primaryType: "ISFJ" } }],
  characterGender: "perempuan",
  complete: false,
  currentPosition: 2,
  identity: { complete: false, group: "SJ", line: "ISFJ · SJ", type16: "ISFJ" },
  steps: [
    { moduleKey: "type_16", position: 1, required: true, status: "completed" },
    { moduleKey: "enneagram", position: 2, required: false, status: "available" },
    { moduleKey: "socionics_communication", position: 3, required: false, status: "locked" },
    { moduleKey: "trait_profile", position: 4, required: false, status: "locked" },
    { moduleKey: "psychosophy", position: 5, required: false, status: "locked" },
  ],
};

describe("LensAttachPicker", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("lensadiri_identity_journey", "journey-token-123");
    sessionStorage.setItem("lensadiri_identity_journey_age", "18");
    mocks.push.mockReset();
    mocks.getIdentityJourney.mockReset();
    mocks.getIdentityJourney.mockResolvedValue(journey);
    mocks.continueIdentityJourney.mockReset();
    mocks.continueIdentityJourney.mockResolvedValue({
      moduleKey: "enneagram",
      token: "assessment-token-2",
    });
  });

  afterEach(cleanup);

  test("renders the canonical five-step rail and unlocks only Enneagram", async () => {
    render(<LensAttachPicker resultToken="result-token-1" />);
    expect(screen.getByRole("heading", { name: "Workbench Polamu" })).toBeDefined();
    await screen.findByText("16-Type");
    expect(screen.getByText("Socionics-inspired")).toBeDefined();
    expect(screen.getByText("Big Five / SLOAN")).toBeDefined();
    expect(screen.getByText("Attitudinal Psyche")).toBeDefined();
    expect(screen.getByRole("button", { name: "Mulai Enneagram" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Mulai Enneagram" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Mulai Socionics/u })).toBeNull();
  });

  test("starts the server-selected next test", async () => {
    render(<LensAttachPicker resultToken="result-token-1" />);
    const startButton = await screen.findByRole("button", { name: "Mulai Enneagram" });
    fireEvent.click(screen.getByRole("checkbox"));
    await act(async () => {
      fireEvent.click(startButton);
    });
    expect(mocks.continueIdentityJourney).toHaveBeenCalledWith({
      age: 18,
      experimentalAcknowledged: true,
      journeyToken: "journey-token-123",
    });
    expect(mocks.push).toHaveBeenCalledWith("/test/assessment-token-2");
  });

  test("can stop temporarily and show the partial collection", async () => {
    const onDone = vi.fn();
    render(<LensAttachPicker resultToken="result-token-1" onDone={onDone} />);
    await screen.findByText("ISFJ · SJ");
    fireEvent.click(screen.getByRole("button", { name: "Simpan dan lihat koleksi" }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});

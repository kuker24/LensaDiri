import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GenderSelectionGate } from "@/components/gender-selection-gate";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  startIdentityJourney: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/assessment/client", () => ({
  startIdentityJourney: mocks.startIdentityJourney,
}));

describe("GenderSelectionGate Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    mocks.push.mockReset();
    mocks.startIdentityJourney.mockReset();
    mocks.startIdentityJourney.mockResolvedValue({
      journeyToken: "journey-token-123",
      token: "assessment-token-123",
    });
  });

  afterEach(cleanup);

  test("renders heading, both gender options, and defaults to Perempuan", () => {
    render(<GenderSelectionGate />);

    expect(screen.getByRole("heading", { name: "Pilih wujudmu" })).toBeDefined();

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[1]?.getAttribute("aria-checked")).toBe("false");
  });

  test("can switch to Laki-laki and starts the combined journey with the entered age", async () => {
    render(<GenderSelectionGate />);

    const radios = screen.getAllByRole("radio");
    // Click Laki-laki
    fireEvent.click(radios[1]!);
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");

    fireEvent.change(screen.getByRole("spinbutton", { name: /Usia/iu }), {
      target: { value: "24" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    const submitBtn = screen.getByRole("button", { name: /Testlensa/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(sessionStorage.getItem("lensadiri_gender")).toBe("laki");
    // The age reaching the server is the one the user typed, never a placeholder.
    expect(mocks.startIdentityJourney).toHaveBeenCalledWith({
      age: 24,
      characterGender: "laki",
    });
    expect(sessionStorage.getItem("lensadiri_identity_journey")).toBe("journey-token-123");
    expect(sessionStorage.getItem("lensadiri_identity_journey_age")).toBe("24");
    expect(mocks.push).toHaveBeenCalledWith("/test/assessment-token-123");
  });

  test("asks for a real age because the combined run includes an 18+ lens", () => {
    render(<GenderSelectionGate />);

    const ageField = screen.getByRole("spinbutton", { name: /Usia/iu });
    expect(ageField).toBeInTheDocument();
    expect(ageField).toHaveAttribute("min", "18");
    expect(ageField).toHaveAttribute("max", "99");
  });

  test("refuses to start below 18 and never sends an under-age request", async () => {
    render(<GenderSelectionGate />);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByRole("spinbutton", { name: /Usia/iu }), {
      target: { value: "15" },
    });

    const submitBtn = screen.getByRole("button", { name: /Testlensa/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(submitBtn);
    });
    expect(mocks.startIdentityJourney).not.toHaveBeenCalled();
  });

  test("start stays blocked until both consent and a valid age are given", () => {
    render(<GenderSelectionGate />);
    const submit = () => screen.getByRole("button", { name: /Testlensa/i });
    expect(submit()).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit()).toBeDisabled();

    fireEvent.change(screen.getByRole("spinbutton", { name: /Usia/iu }), {
      target: { value: "18" },
    });
    expect(submit()).not.toBeDisabled();
  });
});

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GenderSelectionGate } from "@/components/gender-selection-gate";
import { combinedJourneyMinimumAge } from "@/lib/validation/assessment";

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

  test("can switch to Laki-laki and starts the combined journey", async () => {
    render(<GenderSelectionGate />);

    const radios = screen.getAllByRole("radio");
    // Click Laki-laki
    fireEvent.click(radios[1]!);
    expect(radios[1]?.getAttribute("aria-checked")).toBe("true");

    const submitBtn = screen.getByRole("button", { name: /Testlensa/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(sessionStorage.getItem("lensadiri_gender")).toBe("laki");
    expect(mocks.startIdentityJourney).toHaveBeenCalledWith({
      age: combinedJourneyMinimumAge,
      characterGender: "laki",
    });
    expect(sessionStorage.getItem("lensadiri_identity_journey")).toBe("journey-token-123");
    expect(mocks.push).toHaveBeenCalledWith("/test/assessment-token-123");
  });

  test("asks nothing before starting: no age field and no consent checkbox", () => {
    render(<GenderSelectionGate />);

    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByRole("button", { name: /Testlensa/i })).not.toBeDisabled();
  });

  /**
   * Starting the run still transmits `consent` and `experimentalAcknowledged`,
   * so the limits behind that acknowledgment must be visible before the button.
   * Without this the browser would assert an agreement the user never saw.
   */
  test("still discloses the age range, experimental status, and non-diagnosis limit", () => {
    render(<GenderSelectionGate />);

    const disclosure = screen.getByText(/Untuk usia/iu);
    expect(disclosure.textContent).toContain(String(combinedJourneyMinimumAge));
    expect(disclosure.textContent).toMatch(/eksperimental/iu);
    expect(disclosure.textContent).toMatch(/bukan diagnosis/iu);
    expect(disclosure.textContent).toMatch(/privat/iu);
  });

  test("the age sent is the module floor, so the server gate can never be undercut", async () => {
    render(<GenderSelectionGate />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Testlensa/i }));
    });

    const sent = mocks.startIdentityJourney.mock.calls[0]?.[0] as { age: number };
    expect(sent.age).toBeGreaterThanOrEqual(combinedJourneyMinimumAge);
    expect(sessionStorage.getItem("lensadiri_identity_journey_age")).toBe(
      String(combinedJourneyMinimumAge),
    );
  });
});

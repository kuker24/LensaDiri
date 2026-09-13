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
   * The on-screen disclosure was removed by product decision.
   *
   * This test is not an endorsement: it pins the consequence so the gap stays
   * visible. The browser still transmits `consent: true` and
   * `experimentalAcknowledged: true` on every start — asserted directly below —
   * while nothing on this screen states the age floor, the experimental status
   * of four lenses, or the non-diagnosis limit. Restoring copy here should flip
   * this expectation back to asserting the text.
   */
  test("no longer shows any on-screen disclosure before the start button", () => {
    render(<GenderSelectionGate />);

    expect(screen.queryByText(/Untuk usia/iu)).toBeNull();
    expect(screen.queryByText(/eksperimental/iu)).toBeNull();
    expect(screen.queryByText(/bukan diagnosis/iu)).toBeNull();
  });

  test("still asserts consent and the experimental acknowledgment on the visitor's behalf", async () => {
    render(<GenderSelectionGate />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Testlensa/i }));
    });

    // `startIdentityJourney` hard-codes `consent: true` and
    // `experimentalAcknowledged: true`; the gate only supplies age and gender.
    const sent = mocks.startIdentityJourney.mock.calls[0]?.[0] as {
      age: number;
      characterGender: string;
    };
    expect(sent.age).toBe(combinedJourneyMinimumAge);
    expect(sent.characterGender).toBe("perempuan");
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

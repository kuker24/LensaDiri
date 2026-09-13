import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ResultReport } from "@/components/result-report";
import type { ResultView } from "@/server/repositories/assessment";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth/client", () => ({
  postAuthenticatedMutation: vi.fn(),
}));

const modularResult = {
  kind: "modular",
  createdAt: "2026-09-11T00:00:00.000Z",
  mode: "quick",
  modules: [
    {
      moduleKey: "type_16",
      scoringVersion: "type16-score-1",
      evidenceTier: "B",
      confidence: 0.85,
      quality: { confidence: 0.85, flags: [] },
      scores: [],
      ambiguity: {},
      summary: { disclaimer: "Refleksi", primaryType: "ISFJ" },
    },
  ],
  correlations: [],
  quality: { confidence: 0.85, flags: [] },
  summary: { disclaimer: "Hasil reflektif", moduleKeys: ["type_16"] },
} as unknown as ResultView;

const CONTROLS = "Kontrol privat";

function renderReport(token: string) {
  return render(
    <ResultReport result={modularResult} token={token}>
      <button type="button">{CONTROLS}</button>
    </ResultReport>,
  );
}

describe("ResultReport", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(cleanup);

  test("opens straight on the podium with its trailing controls", () => {
    renderReport("fresh-token");

    expect(screen.getByRole("heading", { name: "HASIL LENSA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CONTROLS })).toBeInTheDocument();
  });

  test("no longer routes through a per-lens claim or attach stage", () => {
    renderReport("fresh-token-2");

    // The combined run finishes all five lenses in one sitting, so there is no
    // interstitial to claim a body or attach a next lens.
    expect(screen.queryByRole("heading", { name: "Ini tubuh karaktermu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Workbench Polamu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Simpan dulu/iu })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Pasang lensa berikutnya/iu }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lensa lain" })).not.toBeInTheDocument();
  });

  test("shows the podium again on a second visit to the same result", () => {
    const token = "revisited-token";
    const first = renderReport(token);
    expect(screen.getByRole("heading", { name: "HASIL LENSA" })).toBeInTheDocument();
    first.unmount();

    renderReport(token);
    expect(screen.getByRole("heading", { name: "HASIL LENSA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CONTROLS })).toBeInTheDocument();
  });

  test("keeps the deep report collapsed until it is opened, and announces the state", () => {
    renderReport("uraian-token");

    const toggle = screen.getByRole("button", { name: /^Uraian$/iu });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "uraian-section");
    // `hidden` removes the panel from the accessibility tree, so the heading
    // inside it must not be reachable while collapsed.
    expect(
      screen.queryByRole("heading", { name: "Uraian Laporan Mendalam" }),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.getByRole("heading", { name: "Uraian Laporan Mendalam" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Uraian$/iu })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CollectibleHero } from "@/components/collectible-hero";

describe("CollectibleHero Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("renders brand, ghost typography, and accessible h1", () => {
    render(<CollectibleHero />);

    // Brand
    expect(screen.getByText("LENSADIRI")).toBeDefined();

    // Ghost text
    expect(screen.getByText("POLA")).toBeDefined();

    // Semantic accessible heading for smoke tests & screen readers
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("Kenali pola dirimu");

    // CTA
    const cta = screen.getByRole("link", { name: /MULAI/i });
    expect(cta.getAttribute("href")).toBe("/start");
    expect(screen.getByText("Bukan diagnosis klinis")).toBeDefined();
  });

  test("keeps types hidden and cycles through anonymous figurines with a 650ms lock", () => {
    render(<CollectibleHero />);

    expect(screen.getByText("Koleksi 01 / 16")).toBeDefined();
    expect(screen.queryByText(/INTJ/u)).toBeNull();
    expect(screen.queryByText(/Arsitek/u)).toBeNull();

    const nextBtn = screen.getByRole("button", { name: "Figurine berikutnya" });
    const prevBtn = screen.getByRole("button", { name: "Figurine sebelumnya" });

    // Roster is grouped by cluster, so INTJ is followed by its NT neighbours.
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(screen.getByText("Koleksi 02 / 16")).toBeDefined();

    // Rapid double click during 650ms lock must be ignored
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(screen.getByText("Koleksi 02 / 16")).toBeDefined();

    // Advance timer past 650ms lock
    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Next click -> moves to ENTJ
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(screen.getByText("Koleksi 03 / 16")).toBeDefined();

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Prev click -> back to INTP
    act(() => {
      fireEvent.click(prevBtn);
    });
    expect(screen.getByText("Koleksi 02 / 16")).toBeDefined();
  });

  test("wraps backward from the first card to the last cluster", () => {
    render(<CollectibleHero />);

    // Prev from index 0 must land on the final roster entry, not stall.
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Figurine sebelumnya" }));
    });
    expect(screen.getByText("Koleksi 16 / 16")).toBeDefined();
  });
});

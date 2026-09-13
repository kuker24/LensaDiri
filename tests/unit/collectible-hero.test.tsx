import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CollectibleHero, HERO_FIGURES } from "@/components/collectible-hero";

/**
 * The visible "Koleksi NN / NN" counter was removed from the stage, so the
 * active card is identified structurally instead: only the centred card is
 * painted at `zIndex: 20`.
 */
function activeCardLabel() {
  const active = document.querySelector('[style*="z-index: 20"]');
  if (!active) throw new Error("no active hero card found");
  const image = active.querySelector("img");
  return image?.getAttribute("alt") ?? "";
}

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
  });

  test("carries both renders of every type without naming them", () => {
    expect(HERO_FIGURES).toHaveLength(32);
    expect(new Set(HERO_FIGURES.map((figure) => figure.code)).size).toBe(16);
    expect(HERO_FIGURES.filter((figure) => figure.variant === "laki")).toHaveLength(16);
    expect(HERO_FIGURES.filter((figure) => figure.variant === "perempuan")).toHaveLength(16);

    render(<CollectibleHero />);

    // No stage copy may leak the type code or its nickname.
    expect(screen.queryByText(/INTJ/u)).toBeNull();
    expect(screen.queryByText(/Arsitek/u)).toBeNull();
    expect(screen.queryByText(/perempuan/u)).toBeNull();
  });

  /**
   * The 650ms input lock is gone. It existed to protect an animated layout
   * (`left`/`height`/`bottom`); the stage now animates `transform` only, and CSS
   * transitions retarget mid-flight. Consecutive clicks must all register — on a
   * 32-card roster the lock cost ~13s of ignored input to reach card 20.
   */
  test("advances on every click with no input lock between them", () => {
    render(<CollectibleHero />);

    expect(activeCardLabel()).toBe("Figurine koleksi 01");

    const nextBtn = screen.getByRole("button", { name: "Figurine berikutnya" });
    const prevBtn = screen.getByRole("button", { name: "Figurine sebelumnya" });

    // Variants are interleaved per type, so the second card is the other
    // render of the same type rather than the next type.
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(activeCardLabel()).toBe("Figurine koleksi 02");

    // Immediately again, with no timer advance: this was previously swallowed.
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(activeCardLabel()).toBe("Figurine koleksi 03");

    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(activeCardLabel()).toBe("Figurine koleksi 04");

    act(() => {
      fireEvent.click(prevBtn);
    });
    expect(activeCardLabel()).toBe("Figurine koleksi 03");
  });

  test("arrow keys drive the stage", () => {
    render(<CollectibleHero />);

    expect(activeCardLabel()).toBe("Figurine koleksi 01");

    act(() => {
      fireEvent.keyDown(window, { key: "ArrowRight" });
    });
    expect(activeCardLabel()).toBe("Figurine koleksi 02");

    act(() => {
      fireEvent.keyDown(window, { key: "ArrowLeft" });
    });
    expect(activeCardLabel()).toBe("Figurine koleksi 01");
  });

  test("wraps backward from the first card to the last cluster", () => {
    render(<CollectibleHero />);

    // Prev from index 0 must land on the final roster entry, not stall.
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Figurine sebelumnya" }));
    });
    expect(activeCardLabel()).toBe("Figurine koleksi 32");
  });
});

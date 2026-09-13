import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  ResultPodium,
  buildCompactIdentityString,
  parseTemperament,
  resolveFigurineSrc,
  resolveStageTheme,
  resolveVisualOverlays,
} from "@/components/result-podium";
import type { ResultView } from "@/server/repositories/assessment";

const mocks = vi.hoisted(() => ({
  postAuthenticatedMutation: vi.fn(),
}));

vi.mock("@/lib/auth/client", () => ({
  postAuthenticatedMutation: mocks.postAuthenticatedMutation,
}));

const mockModularResult = {
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
      summary: {
        disclaimer: "Refleksi",
        primaryType: "ISFJ",
      },
    },
    {
      moduleKey: "enneagram",
      scoringVersion: "enneagram-score-1",
      evidenceTier: "B",
      confidence: 0.8,
      quality: { confidence: 0.8, flags: [] },
      scores: [],
      ambiguity: {},
      summary: {
        disclaimer: "Refleksi",
        corePattern: "pattern_9",
      },
    },
    {
      moduleKey: "temperament",
      scoringVersion: "temperament-score-1",
      evidenceTier: "B",
      confidence: 0.88,
      quality: { confidence: 0.88, flags: [] },
      scores: [],
      ambiguity: {},
      summary: {
        disclaimer: "Refleksi",
        primary: "SJ",
      },
    },
  ],
  correlations: [],
  quality: { confidence: 0.85, flags: [] },
  summary: { disclaimer: "Hasil reflektif", moduleKeys: ["type_16", "enneagram", "temperament"] },
} as unknown as ResultView;

describe("ResultPodium Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(cleanup);

  test("resolves correct stage theme and compact identity string", () => {
    const theme = resolveStageTheme(mockModularResult);
    expect(theme.code).toBe("SJ");
    expect(theme.bg).toBe("#6BBF7A");

    const identity = buildCompactIdentityString(mockModularResult);
    expect(identity).toContain("ISFJ");
    expect(identity).toContain("SJ");
  });

  test("renders first-paint podium, identity, quote, and its two actions", () => {
    const onOpenUraian = vi.fn();

    render(
      <ResultPodium
        result={mockModularResult}
        token="result-token-123"
        onOpenUraian={onOpenUraian}
        isUraianOpen={false}
      />,
    );

    // Heading
    expect(screen.getByRole("heading", { name: "POLAMU SAAT INI" })).toBeDefined();

    // Quote
    expect(screen.getByText(/“Baca sebagai pola, bukan kotak tetap.”/i)).toBeDefined();

    // Compact identity
    expect(screen.getByText(/ISFJ/i)).toBeDefined();

    const uraianBtn = screen.getByRole("button", { name: "Uraian" });
    expect(uraianBtn).toBeDefined();
    expect(screen.getByRole("button", { name: /Bagikan/i })).toBeDefined();

    // The combined run finishes every lens in one sitting, so there is no next
    // lens to attach and no control that offers one.
    expect(screen.queryByRole("button", { name: "Lensa lain" })).toBeNull();

    fireEvent.click(uraianBtn);
    expect(onOpenUraian).toHaveBeenCalledTimes(1);
  });

  test("reserves the full podium for a complete five-lens journey", () => {
    render(
      <ResultPodium
        result={mockModularResult}
        identity={{
          complete: true,
          enneagram: "sx964",
          group: "SJ",
          line: "ISFJ sx964 SEI RCUAN L¹V²E³F⁴ SJ",
          psyche: "L¹V²E³F⁴",
          sloan: "RCUAN",
          socionics: "SEI",
          type16: "ISFJ",
        }}
        completedLensCount={5}
        onOpenUraian={vi.fn()}
        isUraianOpen={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "PODIUM PENUH" })).toBeInTheDocument();
    expect(screen.getByText("ISFJ sx964 SEI RCUAN L¹V²E³F⁴ SJ")).toBeInTheDocument();
    expect(screen.getByText("5 / 5 lensa selesai")).toBeInTheDocument();
  });

  test("correctly parses Keirsey temperaments across all 16 types and resolves figurine paths", () => {
    expect(parseTemperament("INTJ")).toBe("NT");
    expect(parseTemperament("INTP")).toBe("NT");
    expect(parseTemperament("ENTJ")).toBe("NT");
    expect(parseTemperament("ENTP")).toBe("NT");

    expect(parseTemperament("INFJ")).toBe("NF");
    expect(parseTemperament("INFP")).toBe("NF");
    expect(parseTemperament("ENFJ")).toBe("NF");
    expect(parseTemperament("ENFP")).toBe("NF");

    expect(parseTemperament("ISTJ")).toBe("SJ");
    expect(parseTemperament("ISFJ")).toBe("SJ");
    expect(parseTemperament("ESTJ")).toBe("SJ");
    expect(parseTemperament("ESFJ")).toBe("SJ");

    expect(parseTemperament("ISTP")).toBe("SP");
    expect(parseTemperament("ISFP")).toBe("SP");
    expect(parseTemperament("ESTP")).toBe("SP");
    expect(parseTemperament("ESFP")).toBe("SP");

    expect(resolveFigurineSrc("NT")).toBe("/figurines/base-female.png");
    expect(resolveFigurineSrc("NF", "laki")).toBe("/figurines/base-male.png");
    expect(resolveFigurineSrc("SP", "laki", "ESTP")).toBe("/figurines/ESTP-plain.png");
  });

  test("resolveFigurineSrc uses only reviewed plain renders", () => {
    expect(resolveFigurineSrc("NF", "perempuan", "ENFP")).toBe("/figurines/ENFP-plain.png");
    expect(resolveFigurineSrc("NT", "laki", "INTJ")).toBe("/figurines/INTJ-plain.png");
    expect(resolveFigurineSrc("SJ", "laki", " isfj ")).toBe("/figurines/ISFJ-plain.png");
  });

  test("resolveFigurineSrc falls back to the selected plain body", () => {
    expect(resolveFigurineSrc("NT", "laki", "INTP")).toBe("/figurines/base-male.png");
    expect(resolveFigurineSrc("NF", "perempuan", "NOTATYPE")).toBe("/figurines/base-female.png");
  });

  test("resolveFigurineSrc never contradicts the selected gender", () => {
    // ISFJ/INTJ/ESTP renders depict a masculine figurine, so a `perempuan`
    // journey must fall back to the plain body instead of showing them.
    expect(resolveFigurineSrc("SJ", "perempuan", "ISFJ")).toBe("/figurines/base-female.png");
    expect(resolveFigurineSrc("NT", "perempuan", "INTJ")).toBe("/figurines/base-female.png");
    expect(resolveFigurineSrc("SP", "perempuan", "ESTP")).toBe("/figurines/base-female.png");
    // ENFP depicts a feminine figurine.
    expect(resolveFigurineSrc("NF", "laki", "ENFP")).toBe("/figurines/base-male.png");
  });

  test("resolveFigurineSrc stays gender-neutral when gender is withheld", () => {
    // Public share omits gender on purpose; a typed render would leak it.
    expect(resolveFigurineSrc("SJ", undefined, "ISFJ")).toBe("/figurines/base-female.png");
    expect(resolveFigurineSrc("NF", undefined, "ENFP")).toBe("/figurines/base-female.png");
  });

  test("clicking Bagikan triggers public share mutation and copies public share URL without leaking private token", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    mocks.postAuthenticatedMutation.mockResolvedValue({
      shareToken: "safe-public-share-token-xyz",
    });

    render(
      <ResultPodium
        result={mockModularResult}
        token="super-secret-private-token-456"
        onOpenUraian={vi.fn()}
        isUraianOpen={false}
      />,
    );

    const bagikanBtn = screen.getByRole("button", { name: /Bagikan/i });
    await act(async () => {
      fireEvent.click(bagikanBtn);
    });

    expect(mocks.postAuthenticatedMutation).toHaveBeenCalledWith("/api/result/share", {
      token: "super-secret-private-token-456",
    });
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("/shared/safe-public-share-token-xyz"),
    );
    expect(writeTextMock).not.toHaveBeenCalledWith(
      expect.stringContaining("super-secret-private-token-456"),
    );
  });

  test("resolveVisualOverlays dynamically extracts active overlays and omits unselected ones", () => {
    // 1. Result with only RIASEC (no Enneagram, Socionics, Psychosophy)
    const riasecOnly = {
      kind: "modular",
      createdAt: "2026-09-11T00:00:00.000Z",
      mode: "quick",
      modules: [
        {
          moduleKey: "riasec",
          scoringVersion: "riasec-score-1",
          evidenceTier: "B",
          confidence: 0.9,
          quality: { confidence: 0.9, flags: [] },
          scores: [],
          ambiguity: {},
          summary: { hollandCode: "IAS" },
        },
      ],
    } as unknown as ResultView;

    const overlaysRiasec = resolveVisualOverlays(riasecOnly);
    expect(overlaysRiasec.hasSocionics).toBe(false);
    expect(overlaysRiasec.enneaNumber).toBeNull();
    expect(overlaysRiasec.psycheOrbs).toBeNull();

    // 2. Result with Enneagram, Socionics, and Psychosophy
    const multiModule = {
      kind: "modular",
      createdAt: "2026-09-11T00:00:00.000Z",
      mode: "quick",
      modules: [
        {
          moduleKey: "enneagram",
          scoringVersion: "enneagram-score-1",
          evidenceTier: "B",
          confidence: 0.8,
          quality: { confidence: 0.8, flags: [] },
          scores: [],
          ambiguity: {},
          summary: { corePattern: "pattern_4" },
        },
        {
          moduleKey: "socionics_communication",
          scoringVersion: "socionics-score-1",
          evidenceTier: "B",
          confidence: 0.8,
          quality: { confidence: 0.8, flags: [] },
          scores: [],
          ambiguity: {},
          summary: { communicationPattern: "IEE" },
        },
        {
          moduleKey: "psychosophy",
          scoringVersion: "psychosophy-score-1",
          evidenceTier: "B",
          confidence: 0.8,
          quality: { confidence: 0.8, flags: [] },
          scores: [],
          ambiguity: {},
          summary: { priorityOrder: ["physics", "emotion", "will", "logic"] },
        },
      ],
    } as unknown as ResultView;

    const overlaysMulti = resolveVisualOverlays(multiModule);
    expect(overlaysMulti.hasSocionics).toBe(true);
    expect(overlaysMulti.enneaNumber).toBe("4");
    expect(overlaysMulti.psycheOrbs).toHaveLength(4);
    expect(overlaysMulti.psycheOrbs?.[0]?.letter).toBe("F");
    expect(overlaysMulti.psycheOrbs?.[1]?.letter).toBe("E");
    expect(overlaysMulti.psycheOrbs?.[2]?.letter).toBe("V");
    expect(overlaysMulti.psycheOrbs?.[3]?.letter).toBe("L");
  });

  test("uses a neutral stage instead of inferring a cluster from an unrelated lens", () => {
    const riasecOnly = {
      kind: "modular",
      modules: [{ moduleKey: "riasec", summary: { hollandCode: "IAS" }, scores: [] }],
    } as unknown as ResultView;

    expect(resolveStageTheme(riasecOnly).code).toBe("NEUTRAL");
    expect(resolveFigurineSrc("NEUTRAL", "laki")).toBe("/figurines/base-male.png");
  });
});

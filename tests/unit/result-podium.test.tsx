import { existsSync } from "node:fs";
import { join } from "node:path";
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

    // Heading is now state-independent; completeness lives in the badge.
    expect(screen.getByRole("heading", { name: "HASIL LENSA" })).toBeDefined();
    expect(screen.getByText("Koleksi parsial")).toBeDefined();

    // Quote
    expect(screen.getByText(/“Baca sebagai pola, bukan kotak tetap.”/i)).toBeDefined();

    // Compact identity. Matched exactly, not by substring: the code legend also
    // names the type when it explains the trailing group pair, so a loose /ISFJ/
    // now matches two nodes.
    expect(screen.getByText("ISFJ · SJ")).toBeDefined();

    const uraianBtn = screen.getByRole("button", { name: "Uraian" });
    expect(uraianBtn).toBeDefined();
    expect(screen.getByRole("button", { name: /Bagikan/i })).toBeDefined();

    // The combined run finishes every lens in one sitting, so there is no next
    // lens to attach and no control that offers one.
    expect(screen.queryByRole("button", { name: "Lensa lain" })).toBeNull();

    fireEvent.click(uraianBtn);
    expect(onOpenUraian).toHaveBeenCalledTimes(1);
  });

  test("marks a complete five-lens journey with the full-collection badge", () => {
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
        onOpenUraian={vi.fn()}
        isUraianOpen={false}
      />,
    );

    // Same heading as the partial state; only the badge changes.
    expect(screen.getByRole("heading", { name: "HASIL LENSA" })).toBeInTheDocument();
    expect(screen.getByText("Koleksi lengkap")).toBeInTheDocument();
    expect(screen.queryByText("Koleksi parsial")).not.toBeInTheDocument();
    expect(screen.getByText("ISFJ sx964 SEI RCUAN L¹V²E³F⁴ SJ")).toBeInTheDocument();
    // The lens counter badge is gone: the identity line already states which
    // lenses finished, and a "5 / 5" chip beside it said the same thing twice.
    expect(screen.queryByText("5 / 5 lensa selesai")).not.toBeInTheDocument();
    // Each code is also listed against a plain-language label.
    expect(screen.getByText("Gaya kognitif")).toBeInTheDocument();
    expect(screen.getByText("Motivasi inti")).toBeInTheDocument();
    expect(screen.getByText("Gaya komunikasi")).toBeInTheDocument();
    expect(screen.getByText("Pola sifat")).toBeInTheDocument();
    expect(screen.getByText("Prioritas jiwa")).toBeInTheDocument();
    // The trailing pair is printed in the line too, and used to be the one
    // segment with no label anywhere on the page. Matched as a definition term
    // specifically: the code legend uses the same word as a segment heading.
    expect(screen.getAllByText("Kelompok").some((node) => node.tagName === "DT")).toBe(true);
  });

  /**
   * The codes are the reveal; their derivation is the follow-up question. It must
   * be present and reachable, but not open by default, or the card grows taller
   * than the viewport and pushes the actions below the fold.
   */
  test("offers the code derivation as a closed disclosure, not an open block", () => {
    render(
      <ResultPodium
        result={mockModularResult}
        identity={{
          complete: false,
          group: "SJ",
          line: "ISFJ · SJ",
          type16: "ISFJ",
        }}
        onOpenUraian={vi.fn()}
        isUraianOpen={false}
      />,
    );

    const disclosure = screen.getByText("Dari mana huruf-huruf ini?");
    expect(disclosure).toBeInTheDocument();
    // Native details/summary: keyboard operable and searchable while closed,
    // with no motion for reduced-motion users to suppress.
    expect(disclosure.tagName).toBe("SUMMARY");
    const details = disclosure.closest("details");
    expect(details).not.toBeNull();
    expect(details?.hasAttribute("open")).toBe(false);
  });

  /**
   * A wrong explanation of a code is worse than none, so the legend drops any
   * segment whose characters cannot reproduce the stored code. This mock carries
   * no per-construct scores, so the 16-Type derivation is unprovable and must not
   * be invented; only the group pair, which is copied from the type itself,
   * survives.
   */
  test("omits derivations it cannot reproduce from the scores", () => {
    render(
      <ResultPodium
        result={mockModularResult}
        identity={{
          complete: false,
          group: "SJ",
          line: "ISFJ · SJ",
          type16: "ISFJ",
        }}
        onOpenUraian={vi.fn()}
        isUraianOpen={false}
      />,
    );

    // Present as the legend's segment heading, not just as a definition term.
    expect(screen.getAllByText("Kelompok").length).toBeGreaterThan(0);
    // No threshold reasoning survives, because no per-construct score backs it.
    expect(screen.queryByText(/titik seimbang 50/u)).not.toBeInTheDocument();
    expect(screen.getByText(/Dua huruf tengah dari ISFJ/u)).toBeInTheDocument();
  });

  test("podium shows the typed figurine for the picked body and no face overlays", () => {
    render(
      <ResultPodium
        result={mockModularResult}
        characterGender="laki"
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
        onOpenUraian={vi.fn()}
        isUraianOpen={false}
      />,
    );

    // The result must show the MBTI character, not a plain body.
    const figure = screen.getByAltText("Figurine Hasil Karakter LensaDiri");
    expect(figure.getAttribute("src")).toContain("ISFJ-laki.png");
    expect(figure.getAttribute("src")).not.toContain("base-");
    expect(figure.getAttribute("src")).not.toContain("-plain");
    // The acrylic disk label repeated the cluster code and is gone.
    expect(screen.queryByText(/Figurine · POLA/u)).not.toBeInTheDocument();
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
    expect(resolveFigurineSrc("SP", "laki", "ESTP")).toBe("/figurines/ESTP-laki.png");
  });

  test("resolveFigurineSrc serves the typed render for every type and body", () => {
    const codes = [
      "ENFJ",
      "ENFP",
      "ENTJ",
      "ENTP",
      "ESFJ",
      "ESFP",
      "ESTJ",
      "ESTP",
      "INFJ",
      "INFP",
      "INTJ",
      "INTP",
      "ISFJ",
      "ISFP",
      "ISTJ",
      "ISTP",
    ] as const;
    // All 32 combinations ship artwork, so none may degrade to a plain body.
    for (const code of codes) {
      for (const gender of ["laki", "perempuan"] as const) {
        expect(resolveFigurineSrc("NEUTRAL", gender, code)).toBe(
          `/figurines/${code}-${gender}.png`,
        );
      }
    }
    expect(resolveFigurineSrc("SJ", "laki", " isfj ")).toBe("/figurines/ISFJ-laki.png");
  });

  test("resolveFigurineSrc falls back to the selected plain body without a type", () => {
    expect(resolveFigurineSrc("NF", "perempuan", "NOTATYPE")).toBe("/figurines/base-female.png");
    expect(resolveFigurineSrc("NT", "laki", undefined)).toBe("/figurines/base-male.png");
  });

  test("resolveFigurineSrc never contradicts the selected gender", () => {
    // The render always carries the picked body, so the figurine cannot show a
    // gender the user did not choose.
    expect(resolveFigurineSrc("SJ", "perempuan", "ISFJ")).toBe("/figurines/ISFJ-perempuan.png");
    expect(resolveFigurineSrc("NF", "laki", "ENFP")).toBe("/figurines/ENFP-laki.png");
  });

  test("resolveFigurineSrc uses the ungendered type render when gender is withheld", () => {
    // Public share omits owner gender. The matching character still shows; the
    // filename has no laki/perempuan suffix, so the URL cannot leak the pick.
    expect(resolveFigurineSrc("SJ", undefined, "ISFJ")).toBe("/figurines/ISFJ.png");
    expect(resolveFigurineSrc("NF", undefined, "ENFP")).toBe("/figurines/ENFP.png");
    expect(resolveFigurineSrc("NT", undefined, "INTJ")).toBe("/figurines/INTJ.png");
    expect(resolveFigurineSrc("NF", undefined, "INFJ")).toBe("/figurines/INFJ.png");
    expect(resolveFigurineSrc("NF", undefined, "INFJ")).not.toMatch(/laki|perempuan/u);
  });

  test("every figurine the resolver can return exists on disk", () => {
    const codes = ["ENFJ", "ESTP", "INFP", "ISTP", "INTJ", "ISFJ"] as const;
    const paths = new Set<string>([
      resolveFigurineSrc("NEUTRAL", undefined, "ISFJ"),
      resolveFigurineSrc("NEUTRAL", "laki"),
      resolveFigurineSrc("NEUTRAL", "perempuan"),
    ]);
    for (const code of codes) {
      for (const gender of ["laki", "perempuan"] as const) {
        paths.add(resolveFigurineSrc("NEUTRAL", gender, code));
      }
    }
    for (const path of paths) {
      expect(existsSync(join(process.cwd(), "public", path))).toBe(true);
    }
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

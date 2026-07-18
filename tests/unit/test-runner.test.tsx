import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { MAX_RESPONSE_TIME_MS } from "@/components/assessment-response-timer";
import { TestRunner } from "@/components/test-runner";

const mocks = vi.hoisted(() => ({
  completeAssessment: vi.fn(),
  getAssessmentSession: vi.fn(),
  pauseAssessment: vi.fn(),
  push: vi.fn(),
  resolveAssessmentClarifier: vi.fn(),
  resumeAssessment: vi.fn(),
  saveAnswer: vi.fn(),
  saveClarifierAssessmentAnswer: vi.fn(),
  startAssessmentClarifier: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/assessment/client", () => ({
  completeAssessment: mocks.completeAssessment,
  getAssessmentSession: mocks.getAssessmentSession,
  pauseAssessment: mocks.pauseAssessment,
  resolveAssessmentClarifier: mocks.resolveAssessmentClarifier,
  resumeAssessment: mocks.resumeAssessment,
  saveAnswer: mocks.saveAnswer,
  saveClarifierAssessmentAnswer: mocks.saveClarifierAssessmentAnswer,
  startAssessmentClarifier: mocks.startAssessmentClarifier,
}));

const assessmentSession = {
  answeredCount: 0,
  isModular: false,
  mode: "quick",
  questions: [
    {
      answer: null,
      id: "550e8400-e29b-41d4-a716-446655440001",
      order: 1,
      text: "Pertanyaan assessment",
    },
  ],
  status: "active",
  totalCount: 1,
} as const;

const clarifierSession = {
  questions: [
    {
      answer: 3,
      id: "550e8400-e29b-41d4-a716-446655440002",
      moduleKey: "trait_profile",
      order: 1,
      text: "Sudah dijawab",
    },
    {
      answer: null,
      id: "550e8400-e29b-41d4-a716-446655440003",
      moduleKey: "trait_profile",
      order: 2,
      text: "Pertanyaan clarifier",
    },
  ],
  status: "in_progress",
  totalCount: 2,
} as const;

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(0);
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn(() => "550e8400-e29b-41d4-a716-446655440004"),
  });
  mocks.completeAssessment.mockReset();
  mocks.getAssessmentSession.mockReset();
  mocks.pauseAssessment.mockReset();
  mocks.push.mockReset();
  mocks.resolveAssessmentClarifier.mockReset();
  mocks.resumeAssessment.mockReset();
  mocks.saveAnswer.mockReset().mockResolvedValue(undefined);
  mocks.saveClarifierAssessmentAnswer.mockReset().mockResolvedValue(undefined);
  mocks.startAssessmentClarifier.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("TestRunner response timing", () => {
  test("membatasi responseTimeMs jawaban assessment", async () => {
    mocks.getAssessmentSession.mockResolvedValue(assessmentSession);
    render(<TestRunner token="assessment-token" />);

    const answer = await screen.findByRole("button", { name: /5 Sangat sesuai/u });
    vi.mocked(Date.now).mockReturnValue(MAX_RESPONSE_TIME_MS + 1);
    fireEvent.click(answer);

    await act(async () => undefined);
    expect(mocks.saveAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ responseTimeMs: MAX_RESPONSE_TIME_MS }),
    );
  });

  test("menamai progres dan membatasi responseTimeMs clarifier", async () => {
    mocks.getAssessmentSession.mockResolvedValue({
      ...assessmentSession,
      status: "clarifier_required",
    });
    mocks.startAssessmentClarifier.mockResolvedValue(clarifierSession);
    render(<TestRunner token="assessment-token" />);

    const progress = await screen.findByRole("progressbar", { name: "Progres clarifier" });
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "2");
    expect(progress).toHaveAttribute("aria-valuenow", "1");

    vi.mocked(Date.now).mockReturnValue(MAX_RESPONSE_TIME_MS + 1);
    fireEvent.click(screen.getByRole("button", { name: /5 Sangat sesuai/u }));

    await act(async () => undefined);
    expect(mocks.saveClarifierAssessmentAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ responseTimeMs: MAX_RESPONSE_TIME_MS }),
    );
  });
});

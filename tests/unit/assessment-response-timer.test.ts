import { describe, expect, test } from "vitest";

import {
  boundedResponseTimeMs,
  MAX_RESPONSE_TIME_MS,
} from "@/components/assessment-response-timer";

describe("boundedResponseTimeMs", () => {
  test.each([
    ["clock bergerak mundur", 2_000, 1_000, 0],
    ["durasi normal", 1_000, 2_234, 1_234],
    ["tepat satu jam", 0, MAX_RESPONSE_TIME_MS, MAX_RESPONSE_TIME_MS],
    ["lebih dari satu jam", 0, MAX_RESPONSE_TIME_MS + 60_000, MAX_RESPONSE_TIME_MS],
  ])("membatasi %s", (_name, startedAt, now, expected) => {
    expect(boundedResponseTimeMs(startedAt, now)).toBe(expected);
  });

  test("membulatkan durasi ke integer", () => {
    expect(boundedResponseTimeMs(100.2, 200.8)).toBe(101);
  });
});

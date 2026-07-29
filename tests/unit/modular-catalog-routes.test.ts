import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getFlags = vi.hoisted(() => vi.fn());

vi.mock("@/server/repositories/catalog", () => ({
  isFeatureEnabledBatch: getFlags,
}));

import { GET as getCombos } from "@/app/api/combos/route";
import { GET as getModules } from "@/app/api/modules/route";

beforeEach(() => {
  getFlags.mockReset().mockResolvedValue({
    FEATURE_COMPLEX_MODE: true,
    FEATURE_MODULAR_COMPOSER: true,
  });
});

afterEach(() => vi.useRealTimers());

describe("public modular catalog", () => {
  test("returns the release snapshot after one batched flag read", async () => {
    const response = await getModules();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.modules).toHaveLength(10);
    expect(payload.data.modes).toHaveLength(3);
    expect(payload.data.combos).toHaveLength(5);
    expect(
      payload.data.modules.some((module: { key: string }) => module.key === "trait_profile"),
    ).toBe(true);
    expect(getFlags).toHaveBeenCalledOnce();
    expect(getFlags).toHaveBeenCalledWith(["FEATURE_MODULAR_COMPOSER", "FEATURE_COMPLEX_MODE"]);
  });

  test("returns combo presets after one batched flag read", async () => {
    const response = await getCombos();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.combos).toHaveLength(5);
    expect(
      payload.data.combos.some((combo: { key: string }) => combo.key === "core_personality"),
    ).toBe(true);
    expect(getFlags).toHaveBeenCalledOnce();
  });

  test("keeps the catalog available and coalesces reads when the flag query stalls", async () => {
    vi.useFakeTimers();
    let resolveFlags!: (flags: Record<string, boolean>) => void;
    getFlags.mockImplementationOnce(
      () => new Promise<Record<string, boolean>>((resolve) => (resolveFlags = resolve)),
    );

    const responsePromises = [getModules(), getModules(), getCombos()];
    await vi.advanceTimersByTimeAsync(500);
    const responses = await Promise.all(responsePromises);

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(getFlags).toHaveBeenCalledOnce();
    resolveFlags({ FEATURE_COMPLEX_MODE: true, FEATURE_MODULAR_COMPOSER: true });
    await Promise.resolve();
  });

  test("honors the composer and Complex rollback flags when available", async () => {
    getFlags.mockResolvedValueOnce({
      FEATURE_COMPLEX_MODE: false,
      FEATURE_MODULAR_COMPOSER: true,
    });
    const complexOff = await getModules();
    const complexOffPayload = await complexOff.json();
    expect(complexOffPayload.data.modes).toContainEqual(
      expect.objectContaining({ internalMode: "deep", isSelectable: false }),
    );
    expect(
      complexOffPayload.data.combos.some(
        (combo: { recommendedMode: string }) => combo.recommendedMode === "deep",
      ),
    ).toBe(false);

    getFlags.mockResolvedValueOnce({
      FEATURE_COMPLEX_MODE: false,
      FEATURE_MODULAR_COMPOSER: false,
    });
    const composerOff = await getModules();
    expect(composerOff.status).toBe(404);

    getFlags.mockRejectedValueOnce(new Error("database unavailable"));
    const composerOffDuringOutage = await getModules();
    expect(composerOffDuringOutage.status).toBe(404);
  });
});

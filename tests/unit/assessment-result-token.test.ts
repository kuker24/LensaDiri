import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";

const mocks = vi.hoisted(() => ({
  getResultByHash: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db/env", () => ({
  getServerEnvironment: () => ({
    tokenHashPepper: "unit-test-result-token-pepper-at-least-32-characters",
  }),
}));

vi.mock("@/server/repositories/assessment", () => ({
  createAssessmentSession: vi.fn(),
  getResultByHash: mocks.getResultByHash,
}));

import { getPrivateResultByToken } from "@/server/services/assessment";

const pepper = "unit-test-result-token-pepper-at-least-32-characters";

describe("private result token service", () => {
  beforeEach(() => {
    mocks.getResultByHash.mockReset();
  });

  it("validates and hashes the opaque token before repository lookup", async () => {
    const token = generateOpaqueToken();
    mocks.getResultByHash.mockResolvedValue(null);

    await expect(getPrivateResultByToken(token)).resolves.toBeNull();
    expect(mocks.getResultByHash).toHaveBeenCalledOnce();
    expect(mocks.getResultByHash).toHaveBeenCalledWith(hashOpaqueToken(token, pepper));
    expect(mocks.getResultByHash).not.toHaveBeenCalledWith(token);
  });

  it("rejects malformed tokens without querying the repository", async () => {
    await expect(getPrivateResultByToken("raw-database-id")).resolves.toBeNull();
    expect(mocks.getResultByHash).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";

const mocks = vi.hoisted(() => ({
  getResultByHash: vi.fn(),
  isJourneyAttachedResultHash: vi.fn(),
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

vi.mock("@/server/repositories/identity-journeys", () => ({
  isJourneyAttachedResultHash: mocks.isJourneyAttachedResultHash,
}));

import {
  getPrivateResultByToken,
  getResultForDataRightsByToken,
} from "@/server/services/assessment";

const pepper = "unit-test-result-token-pepper-at-least-32-characters";

describe("private result token service", () => {
  beforeEach(() => {
    mocks.getResultByHash.mockReset();
    mocks.isJourneyAttachedResultHash.mockReset();
    mocks.isJourneyAttachedResultHash.mockResolvedValue(true);
  });

  it("validates and hashes the opaque token before repository lookup", async () => {
    const token = generateOpaqueToken();
    mocks.getResultByHash.mockResolvedValue(null);

    await expect(getPrivateResultByToken(token)).resolves.toBeNull();
    expect(mocks.getResultByHash).toHaveBeenCalledOnce();
    expect(mocks.getResultByHash).toHaveBeenCalledWith(hashOpaqueToken(token, pepper));
    expect(mocks.getResultByHash).not.toHaveBeenCalledWith(token);
    expect(mocks.isJourneyAttachedResultHash).toHaveBeenCalledWith(hashOpaqueToken(token, pepper));
  });

  it("rejects malformed tokens without querying the repository", async () => {
    await expect(getPrivateResultByToken("raw-database-id")).resolves.toBeNull();
    expect(mocks.getResultByHash).not.toHaveBeenCalled();
    expect(mocks.isJourneyAttachedResultHash).not.toHaveBeenCalled();
  });

  it("closes the reader for a result that is not attached to an identity journey", async () => {
    const token = generateOpaqueToken();
    mocks.isJourneyAttachedResultHash.mockResolvedValue(false);

    await expect(getPrivateResultByToken(token)).resolves.toBeNull();
    expect(mocks.getResultByHash).not.toHaveBeenCalled();
  });

  it("keeps export and deletion reachable for results outside the identity journey", async () => {
    const token = generateOpaqueToken();
    mocks.isJourneyAttachedResultHash.mockResolvedValue(false);
    mocks.getResultByHash.mockResolvedValue({ kind: "legacy" });

    await expect(getResultForDataRightsByToken(token)).resolves.toEqual({ kind: "legacy" });
    expect(mocks.getResultByHash).toHaveBeenCalledWith(hashOpaqueToken(token, pepper));
    expect(mocks.isJourneyAttachedResultHash).not.toHaveBeenCalled();
  });

  it("rejects malformed tokens on the data-rights reader too", async () => {
    await expect(getResultForDataRightsByToken("raw-database-id")).resolves.toBeNull();
    expect(mocks.getResultByHash).not.toHaveBeenCalled();
  });
});

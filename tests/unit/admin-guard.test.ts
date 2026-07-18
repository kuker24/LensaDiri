import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findAccountByIdForAuthentication: vi.fn(),
  getCurrentSession: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/server/current-session", () => ({ getCurrentSession: mocks.getCurrentSession }));
vi.mock("@/server/repositories/accounts", () => ({
  findAccountByIdForAuthentication: mocks.findAccountByIdForAuthentication,
}));

import { requireAdminSession } from "@/server/services/admin";

const accountBase = {
  id: "00000000-0000-4000-8000-000000000001",
  passwordHash: "not-used-by-admin-guard",
  status: "active" as const,
};

describe("admin session guard", () => {
  beforeEach(() => {
    mocks.getCurrentSession.mockReset();
    mocks.findAccountByIdForAuthentication.mockReset();
  });

  it("fails closed for guests and regular users", async () => {
    mocks.getCurrentSession.mockResolvedValueOnce(null);
    await expect(requireAdminSession()).resolves.toBeNull();
    expect(mocks.findAccountByIdForAuthentication).not.toHaveBeenCalled();

    mocks.getCurrentSession.mockResolvedValueOnce({ accountId: accountBase.id });
    mocks.findAccountByIdForAuthentication.mockResolvedValueOnce({
      ...accountBase,
      role: "user",
    });
    await expect(requireAdminSession()).resolves.toBeNull();
  });

  it.each(["admin", "super_admin"] as const)("accepts the %s role", async (role) => {
    mocks.getCurrentSession.mockResolvedValue({ accountId: accountBase.id });
    mocks.findAccountByIdForAuthentication.mockResolvedValue({ ...accountBase, role });

    await expect(requireAdminSession()).resolves.toEqual({ accountId: accountBase.id, role });
  });
});

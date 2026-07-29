import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  begin: vi.fn(),
  end: vi.fn(() => Promise.resolve()),
  postgres: vi.fn(),
}));

mocks.postgres.mockImplementation(() => ({ begin: mocks.begin, end: mocks.end }));

vi.mock("server-only", () => ({}));
vi.mock("postgres", () => ({ default: mocks.postgres }));
vi.mock("@/lib/db/env", () => ({
  getServerEnvironment: () => ({
    databaseUrl: "postgres://example.test/database",
    isProduction: true,
  }),
}));

import { createDatabaseTimeoutReset, getDatabase } from "@/lib/db/client";

describe("production database client", () => {
  beforeEach(() => {
    mocks.postgres.mockClear();
    mocks.end.mockClear();
    delete (globalThis as typeof globalThis & { lensadiriDatabaseClient?: unknown })
      .lensadiriDatabaseClient;
  });

  test("uses two transaction-pooler connections per serverless instance", () => {
    getDatabase();

    expect(mocks.postgres).toHaveBeenCalledWith(
      "postgres://example.test/database",
      expect.objectContaining({ max: 2, prepare: false }),
    );
  });

  test("terminates and detaches a timed-out pool", () => {
    const timedOutClient = getDatabase();
    const resetDatabase = createDatabaseTimeoutReset();

    resetDatabase();

    expect(mocks.end).toHaveBeenCalledWith({ timeout: 0 });
    expect(getDatabase()).not.toBe(timedOutClient);
    expect(mocks.postgres).toHaveBeenCalledTimes(2);
  });

  test("does not terminate a replacement pool after a concurrent timeout", () => {
    getDatabase();
    const firstReset = createDatabaseTimeoutReset();
    const secondReset = createDatabaseTimeoutReset();

    firstReset();
    const replacementClient = getDatabase();
    secondReset();

    expect(getDatabase()).toBe(replacementClient);
    expect(mocks.end).toHaveBeenCalledOnce();
  });
});

import { beforeEach, describe, expect, test, vi } from "vitest";

const postgresMock = vi.hoisted(() => vi.fn(() => ({ begin: vi.fn(), end: vi.fn() })));

vi.mock("server-only", () => ({}));
vi.mock("postgres", () => ({ default: postgresMock }));
vi.mock("@/lib/db/env", () => ({
  getServerEnvironment: () => ({
    databaseUrl: "postgres://example.test/database",
    isProduction: true,
  }),
}));

import { getDatabase } from "@/lib/db/client";

describe("production database client", () => {
  beforeEach(() => {
    postgresMock.mockClear();
    delete (globalThis as typeof globalThis & { lensadiriDatabaseClient?: unknown })
      .lensadiriDatabaseClient;
  });

  test("uses two transaction-pooler connections per serverless instance", () => {
    getDatabase();

    expect(postgresMock).toHaveBeenCalledWith(
      "postgres://example.test/database",
      expect.objectContaining({ max: 2, prepare: false }),
    );
  });
});

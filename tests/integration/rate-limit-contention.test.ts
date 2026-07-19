import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { consumeRateLimit } from "@/server/services/rate-limiter";
import { DatabaseError } from "@/lib/db/errors";
import type { RateLimitRoute } from "@/lib/security/rate-limit";

const limitSecret = process.env.RATE_LIMIT_SECRET!;

afterAll(async () => {
  await closeDatabaseForTests();
});

describe("Rate limit lock contention local database integration", () => {
  it("terminates block wait and throws DatabaseError('unavailable') under lock contention within ~1-2s", async () => {
    const sql = getDatabase();
    const identity = `contention-user-${randomUUID()}`;
    const now = new Date("2026-07-28T12:00:00.000Z");
    const routeKey = "assessment_estimate";

    // 1. Establish the row by calling once to insert it
    const policy = { limit: 10, routeKey: routeKey as RateLimitRoute, windowMs: 15 * 60 * 1000 };
    const firstResult = await consumeRateLimit(identity, policy, limitSecret, now);
    expect(firstResult.allowed).toBe(true);

    const keyHash = hashOpaqueToken(`${routeKey}:${identity}`, limitSecret);
    const windowStart = new Date("2026-07-28T12:00:00.000Z");

    // 2. Open a separate transaction to hold a lock on that row
    const lockTx = sql.begin(async (tx) => {
      // Lock the row exclusively
      await tx`
        select id from public.rate_limits
        where key_hash = ${keyHash}
          and route_key = ${routeKey}
          and window_start = ${windowStart}
        for update
      `;
      // Sleep inside the transaction to simulate a stalled transaction (hold lock for 4 seconds)
      await tx`select pg_sleep(4)`;
    });

    // Wait briefly to ensure lockTx has established the lock
    await new Promise((resolve) => setTimeout(resolve, 300));

    const startTime = Date.now();

    // 3. Try to consume the rate limit on the locked row. This should trigger lock_timeout (1s).
    let caughtError: unknown = null;
    try {
      await consumeRateLimit(identity, policy, limitSecret, now);
    } catch (err) {
      caughtError = err;
    }

    const duration = Date.now() - startTime;

    // Clean up: wait for the locking transaction to complete
    await lockTx.catch(() => {});

    // 4. Assertions
    expect(caughtError).toBeInstanceOf(DatabaseError);
    expect((caughtError as DatabaseError).kind).toBe("unavailable");

    // The lock_timeout is 1000ms, and query statement timeout is 1500ms.
    // The query should fail fast, definitely under 2.5 seconds (2500ms).
    // Traditional PostgreSQL locks without timeout would hang forever (or until vitest/jest timeout of 30s).
    expect(duration).toBeGreaterThanOrEqual(900); // Should wait at least 1s lock_timeout
    expect(duration).toBeLessThan(2500); // Should fail fast before 2.5s
  });
});

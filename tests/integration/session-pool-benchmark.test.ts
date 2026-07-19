import { randomUUID } from "node:crypto";

import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { createAccount } from "@/server/repositories/accounts";
import { createAccountSession } from "@/server/repositories/sessions";

afterAll(async () => {
  await closeDatabaseForTests();
});

function createPool(max: number) {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is required for this benchmark");
  return postgres(url, {
    connect_timeout: 3,
    connection: { lock_timeout: 3000, statement_timeout: 5000 },
    idle_timeout: 15,
    max,
    prepare: false,
    ssl: false,
  });
}

async function benchmarkConcurrentReads(
  pool: ReturnType<typeof postgres>,
  tokenHash: string,
  concurrency: number,
): Promise<{ durationMs: number; ok: number }> {
  const started = process.hrtime.bigint();
  const results = await Promise.allSettled(
    Array.from(
      { length: concurrency },
      () =>
        pool<{ session_id: string }[]>`
        select id as session_id
        from public.account_sessions
        where session_token_hash = ${tokenHash}
        limit 1
      `,
    ),
  );
  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const ok = results.filter((result) => result.status === "fulfilled").length;
  return { durationMs, ok };
}

describe("session read pool sizing", () => {
  it("keeps pool max=1 correct under concurrency; only upgrades if max=2 is materially faster", async () => {
    const suffix = randomUUID();
    const email = `pool-bench-${suffix}@example.test`;
    const account = await createAccount({
      email,
      emailNormalized: email,
      passwordHash: await hashPassword("integration password 123"),
    });
    const tokenHash = hashOpaqueToken(`pool-bench-${suffix}`, process.env.TOKEN_HASH_PEPPER!);
    await createAccountSession({
      accountId: account.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      ipHash: null,
      sessionTokenHash: tokenHash,
      userAgentHash: null,
    });

    // Warm the connection so the benchmark measures pool contention, not cold start.
    await getDatabase()`select 1`;

    const concurrency = 8;
    const pool1 = createPool(1);
    const pool2 = createPool(2);

    try {
      const bench1 = await benchmarkConcurrentReads(pool1, tokenHash, concurrency);
      const bench2 = await benchmarkConcurrentReads(pool2, tokenHash, concurrency);

      console.log(
        `[BENCHMARK] pool max=1 duration=${bench1.durationMs.toFixed(2)}ms ok=${bench1.ok}/${concurrency}`,
      );
      console.log(
        `[BENCHMARK] pool max=2 duration=${bench2.durationMs.toFixed(2)}ms ok=${bench2.ok}/${concurrency}`,
      );

      // Correctness gate: max=1 must still complete every read (sequential is acceptable, failure is not).
      expect(bench1.ok).toBe(concurrency);
      expect(bench2.ok).toBe(concurrency);

      // Decision gate: only justify max=2 if it measurably reduces contention (documented in PR, not auto-applied).
      const materialSpeedup = bench2.durationMs < bench1.durationMs * 0.75;
      console.log(`[BENCHMARK] max=2 materially faster than max=1: ${materialSpeedup}`);
    } finally {
      await pool1.end({ timeout: 3 });
      await pool2.end({ timeout: 3 });
    }
  }, 30_000);
});

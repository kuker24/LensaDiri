import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { createAccount } from "@/server/repositories/accounts";
import { createAccountSession, findAndTouchActiveSession } from "@/server/repositories/sessions";

afterAll(async () => {
  await closeDatabaseForTests();
});

describe("authenticated session read path", () => {
  it("serves concurrent checks without write amplification and touches only after ten minutes", async () => {
    const suffix = randomUUID();
    const email = `session-read-${suffix}@example.test`;
    const account = await createAccount({
      email,
      emailNormalized: email,
      passwordHash: await hashPassword("integration password 123"),
    });
    const tokenHash = hashOpaqueToken(`session-${suffix}`, process.env.TOKEN_HASH_PEPPER!);
    const createdAt = new Date();

    await createAccountSession({
      accountId: account.id,
      expiresAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
      ipHash: null,
      sessionTokenHash: tokenHash,
      userAgentHash: null,
    });

    const sql = getDatabase();
    const [before] = await sql<{ last_seen_at: Date }[]>`
      select last_seen_at from public.account_sessions where session_token_hash = ${tokenHash}
    `;

    const checks = await Promise.all(
      Array.from({ length: 12 }, () =>
        findAndTouchActiveSession(tokenHash, new Date(createdAt.getTime() + 9 * 60 * 1000)),
      ),
    );
    const [unchanged] = await sql<{ last_seen_at: Date }[]>`
      select last_seen_at from public.account_sessions where session_token_hash = ${tokenHash}
    `;

    expect(checks.every((session) => session?.accountId === account.id)).toBe(true);
    expect(unchanged?.last_seen_at.getTime()).toBe(before?.last_seen_at.getTime());

    const touchedAt = new Date(createdAt.getTime() + 11 * 60 * 1000);
    await Promise.all(
      Array.from({ length: 12 }, () => findAndTouchActiveSession(tokenHash, touchedAt)),
    );
    const [touched] = await sql<{ last_seen_at: Date }[]>`
      select last_seen_at from public.account_sessions where session_token_hash = ${tokenHash}
    `;

    expect(touched?.last_seen_at.getTime()).toBe(touchedAt.getTime());
  }, 30_000);

  it("fails closed for expired and revoked sessions without touching them", async () => {
    const suffix = randomUUID();
    const email = `session-closed-${suffix}@example.test`;
    const account = await createAccount({
      email,
      emailNormalized: email,
      passwordHash: await hashPassword("integration password 123"),
    });
    const tokenHash = hashOpaqueToken(`session-${suffix}`, process.env.TOKEN_HASH_PEPPER!);
    const createdAt = new Date();

    await createAccountSession({
      accountId: account.id,
      expiresAt: new Date(createdAt.getTime() + 60 * 1000),
      ipHash: null,
      sessionTokenHash: tokenHash,
      userAgentHash: null,
    });

    expect(
      await findAndTouchActiveSession(tokenHash, new Date(createdAt.getTime() + 61 * 1000)),
    ).toBeNull();

    const sql = getDatabase();
    await sql`
      update public.account_sessions
      set revoked_at = statement_timestamp()
      where session_token_hash = ${tokenHash}
    `;
    expect(await findAndTouchActiveSession(tokenHash, new Date())).toBeNull();
  });
});

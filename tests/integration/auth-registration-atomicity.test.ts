import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { closeDatabaseForTests, getDatabase } from "@/lib/db/client";
import { registerAccount } from "@/server/services/auth";

afterAll(async () => {
  await closeDatabaseForTests();
});

describe("Registration Atomicity and Resilience", () => {
  it("creates account and audit log atomically in a single transaction", async () => {
    const sql = getDatabase();
    const email = `atomic-success-${randomUUID()}@example.com`;
    const password = "qa-auth-seq-1234567890!";

    const res = await registerAccount({ email, password });
    expect(res.created).toBe(true);

    // Verify account exists
    const [account] = await sql<{ id: string }[]>`
      select id from public.accounts where email = ${email}
    `;
    expect(account).toBeDefined();
    if (!account) throw new Error("Account not found");

    // Verify corresponding audit log exists
    const [audit] = await sql<{ id: string; action: string }[]>`
      select id, action from public.audit_logs where actor_account_id = ${account.id}
    `;
    expect(audit).toBeDefined();
    if (!audit) throw new Error("Audit log not found");
    expect(audit.action).toBe("account_registered");
  });

  it("rolls back when account insert is blocked by a table lock (no orphan)", async () => {
    const sql = getDatabase();
    const email = `block-account-${randomUUID()}@example.com`;
    const password = "qa-auth-seq-1234567890!";

    const lockSql = getDatabase();
    await lockSql.begin(async (tx) => {
      await tx`lock table public.accounts in exclusive mode`;
      await expect(registerAccount({ email, password })).rejects.toThrow();
    });

    const rows = await sql<{ id: string }[]>`
      select id from public.accounts where email = ${email}
    `;
    expect(rows).toHaveLength(0);
  });

  it("rolls back when audit log insert is blocked by a table lock (no orphan)", async () => {
    const sql = getDatabase();
    const email = `block-audit-${randomUUID()}@example.com`;
    const password = "qa-auth-seq-1234567890!";

    const lockSql = getDatabase();
    await lockSql.begin(async (tx) => {
      await tx`lock table public.audit_logs in exclusive mode`;
      await expect(registerAccount({ email, password })).rejects.toThrow();
    });

    const rows = await sql<{ id: string }[]>`
      select id from public.accounts where email = ${email}
    `;
    expect(rows).toHaveLength(0);
  });

  it("handles duplicate email conflict deterministically and returns created=false", async () => {
    const sql = getDatabase();
    const email = `atomic-conflict-${randomUUID()}@example.com`;
    const password = "qa-auth-seq-1234567890!";

    const first = await registerAccount({ email, password });
    expect(first.created).toBe(true);

    const second = await registerAccount({ email, password });
    expect(second.created).toBe(false);

    // Verify only one account exists for this email
    const rows = await sql<{ id: string }[]>`
      select id from public.accounts where email = ${email}
    `;
    expect(rows).toHaveLength(1);
  });
});

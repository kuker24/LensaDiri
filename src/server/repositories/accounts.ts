import "server-only";

import { getDatabase } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

export type AccountRole = "user" | "admin" | "super_admin";
export type AccountStatus = "active" | "suspended" | "deleted";

export type AccountAuthenticationRecord = {
  id: string;
  passwordHash: string;
  role: AccountRole;
  status: AccountStatus;
};

export type CreatedAccount = {
  id: string;
};

export async function createAccount(input: {
  email: string;
  emailNormalized: string;
  passwordHash: string;
}): Promise<CreatedAccount> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [account] = await sql<{ id: string }[]>`
      insert into public.accounts (email, email_normalized, password_hash)
      values (${input.email}, ${input.emailNormalized}, ${input.passwordHash})
      returning id
    `;

    if (!account) {
      throw new Error("Account insert returned no row.");
    }

    return account;
  });
}

export async function findAccountForAuthentication(
  emailNormalized: string,
): Promise<AccountAuthenticationRecord | null> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [account] = await sql<
      {
        id: string;
        password_hash: string;
        role: AccountRole;
        status: AccountStatus;
      }[]
    >`
      select id, password_hash, role, status
      from public.accounts
      where email_normalized = ${emailNormalized}
        and deleted_at is null
      limit 1
    `;

    return account
      ? {
          id: account.id,
          passwordHash: account.password_hash,
          role: account.role,
          status: account.status,
        }
      : null;
  });
}

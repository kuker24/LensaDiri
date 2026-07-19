import "server-only";

import postgres, { type Sql, type TransactionSql } from "postgres";

import { getServerEnvironment } from "@/lib/db/env";

const globalForDatabase = globalThis as typeof globalThis & {
  lensadiriDatabaseClient?: Sql;
};

function isLocalDatabaseUrl(databaseUrl: string): boolean {
  const host = new URL(databaseUrl).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function getDatabase(): Sql {
  if (globalForDatabase.lensadiriDatabaseClient) {
    return globalForDatabase.lensadiriDatabaseClient;
  }

  const environment = getServerEnvironment();
  const client = postgres(environment.databaseUrl, {
    // Fail before the bounded assessment/session route paths exhaust their wall-clock deadlines.
    connect_timeout: 3,
    idle_timeout: 15,
    max: environment.isProduction ? 1 : 10,
    // Connection parameters sent as startup options for every session.
    connection: {
      lock_timeout: 3000,
      statement_timeout: 5000,
    },
    // Supabase transaction pooler does not support named prepared statements.
    prepare: false,
    ssl:
      environment.isProduction && !isLocalDatabaseUrl(environment.databaseUrl) ? "require" : false,
  });

  globalForDatabase.lensadiriDatabaseClient = client;
  return client;
}

export async function withTransaction<T>(
  callback: (sql: TransactionSql) => Promise<T>,
): Promise<T> {
  return getDatabase().begin(async (sql) => callback(sql)) as Promise<T>;
}

export async function closeDatabaseForTests(): Promise<void> {
  if (globalForDatabase.lensadiriDatabaseClient) {
    await globalForDatabase.lensadiriDatabaseClient.end({ timeout: 5 });
    delete globalForDatabase.lensadiriDatabaseClient;
  }
}

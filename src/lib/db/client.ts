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
    idle_timeout: 20,
    max: 10,
    prepare: true,
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

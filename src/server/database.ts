import "server-only";

import { mapDatabaseError } from "@/lib/db/errors";

export async function runDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

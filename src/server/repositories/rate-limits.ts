import "server-only";

import { getDatabase } from "@/lib/db/client";
import type { RateLimitRoute } from "@/lib/security/rate-limit";
import { runDatabaseOperation } from "@/server/database";

export async function incrementRateLimit(input: {
  keyHash: string;
  routeKey: RateLimitRoute;
  windowStart: Date;
}): Promise<number> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const [limit] = await sql<{ count: number }[]>`
      insert into public.rate_limits (key_hash, route_key, window_start)
      values (${input.keyHash}, ${input.routeKey}, ${input.windowStart})
      on conflict (key_hash, route_key, window_start)
      do update set count = public.rate_limits.count + 1
      returning count
    `;

    if (!limit) {
      throw new Error("Rate-limit write returned no row.");
    }

    return limit.count;
  });
}

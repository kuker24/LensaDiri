import "server-only";

import { getDatabase } from "@/lib/db/client";
import { runDatabaseOperation } from "@/server/database";

export type RetentionCounts = Record<string, number>;

function toCounts(rows: readonly { resource: string; value: number | string }[]): RetentionCounts {
  const counts: RetentionCounts = {};
  for (const row of rows) {
    const value = typeof row.value === "string" ? Number.parseInt(row.value, 10) : row.value;
    if (Number.isInteger(value) && value >= 0) {
      counts[row.resource] = value;
    }
  }
  return counts;
}

/**
 * Read-only dry run. Returns how many rows the cleanup would remove without
 * deleting anything. Account-owned results are never included.
 */
export async function previewExpiredRetentionData(
  referenceTime = new Date(),
): Promise<RetentionCounts> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<{ resource: string; value: string }[]>`
      select resource, eligible_count as value
      from public.preview_expired_retention_data(${referenceTime})
    `;
    return toCounts(rows);
  });
}

/**
 * Deletes only rows already eligible under published retention policy:
 * expired guest sessions and rate-limit buckets older than 90 days. The
 * underlying function is idempotent, so a repeated or duplicate cron
 * invocation safely reprocesses outstanding work.
 */
export async function cleanupExpiredRetentionData(
  referenceTime = new Date(),
): Promise<RetentionCounts> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<{ resource: string; value: string }[]>`
      select resource, deleted_count as value
      from public.cleanup_expired_retention_data(${referenceTime})
    `;
    return toCounts(rows);
  });
}

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { DatabaseTimeoutError, withDeadline } from "@/lib/async/with-deadline";
import { getServerEnvironment } from "@/lib/db/env";
import { apiFailure, apiSuccess, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { elapsedMilliseconds, logOperationalEvent } from "@/server/observability";
import {
  cleanupExpiredRetentionData,
  previewExpiredRetentionData,
} from "@/server/repositories/retention";

export const runtime = "nodejs";

// Bounded well under the Vercel function limit so a stalled connection returns
// 503 instead of hanging. Every DB call also has connection-level timeouts.
const RETENTION_DB_DEADLINE_MS = 20_000;

function isAuthorized(request: Request, cronSecret: string | null): boolean {
  if (!cronSecret) {
    return false;
  }
  const header = request.headers.get("authorization");
  if (!header) {
    return false;
  }
  const expected = `Bearer ${cronSecret}`;
  const headerBuffer = Buffer.from(header);
  const expectedBuffer = Buffer.from(expected);
  return (
    headerBuffer.length === expectedBuffer.length && timingSafeEqual(headerBuffer, expectedBuffer)
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const environment = getServerEnvironment();

  // Fail closed: without a configured secret or a matching bearer token the
  // endpoint reveals nothing and performs no work.
  if (!isAuthorized(request, environment.cronSecret)) {
    return NextResponse.json(apiFailure("unauthorized"), { headers: noStoreHeaders, status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const operation = dryRun ? "retention_preview" : "retention_cleanup";
  const startedAt = process.hrtime.bigint();

  try {
    const counts = await withDeadline(
      dryRun ? previewExpiredRetentionData() : cleanupExpiredRetentionData(),
      RETENTION_DB_DEADLINE_MS,
    );

    logOperationalEvent({
      durationMs: elapsedMilliseconds(startedAt),
      operation,
      retentionCounts: counts,
      status: "success",
    });

    return NextResponse.json(apiSuccess({ dryRun, counts }), {
      headers: noStoreHeaders,
      status: 200,
    });
  } catch (error) {
    logOperationalEvent({
      durationMs: elapsedMilliseconds(startedAt),
      errorCode: error instanceof DatabaseTimeoutError ? "database_timeout" : "database_error",
      operation,
      status: "failure",
    });

    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: error instanceof DatabaseTimeoutError ? 503 : getDatabaseFailureStatus(error),
    });
  }
}

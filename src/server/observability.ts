import "server-only";

export type OperationalEvent = {
  correlationId?: string;
  durationMs?: number;
  errorCode?:
    | "database_error"
    | "database_timeout"
    | "deadline_exceeded"
    | "rate_limit_unavailable"
    | "rate_limiter_error"
    | undefined;
  operation:
    | "assessment_answer_save"
    | "assessment_complete"
    | "assessment_start"
    | "estimate_catalog_queries"
    | "estimate_composer_candidates"
    | "estimate_computation"
    | "estimate_rate_limit"
    | "login_audit_insert"
    | "login_session_insert"
    | "pool_wait"
    | "register_auth_service"
    | "register_rate_limit"
    | "session_read"
    | "session_touch";
  status:
    | "conflict"
    | "error"
    | "failure"
    | "found"
    | "match"
    | "mismatch"
    | "not_found"
    | "pending_clarifier"
    | "rate_limited"
    | "rejected"
    | "success";
  wrote?: boolean;
};

function safeCorrelationId(value: string | undefined): string | undefined {
  return value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

function safeEnvironment(value: string | undefined): string {
  return value === "development" ||
    value === "preview" ||
    value === "production" ||
    value === "test"
    ? value
    : "unknown";
}

export function elapsedMilliseconds(startedAt: bigint): number {
  return Number((Number(process.hrtime.bigint() - startedAt) / 1_000_000).toFixed(2));
}

export function logOperationalEvent(event: OperationalEvent): void {
  const failure = event.status === "error" || event.status === "failure";
  const record = {
    correlation_id: safeCorrelationId(event.correlationId),
    deployment_sha: /^[0-9a-f]{40}$/i.test(process.env.VERCEL_GIT_COMMIT_SHA ?? "")
      ? process.env.VERCEL_GIT_COMMIT_SHA
      : undefined,
    duration_ms:
      event.durationMs === undefined ? undefined : Math.max(0, Number(event.durationMs.toFixed(2))),
    environment: safeEnvironment(process.env.VERCEL_ENV ?? process.env.NODE_ENV),
    error_code: event.errorCode,
    level: failure ? "error" : "info",
    operation: event.operation,
    schema_version: 1,
    status: event.status,
    timestamp: new Date().toISOString(),
    type: "operational_event",
    wrote: event.wrote,
  };
  const output = JSON.stringify(record);

  if (failure) {
    console.error(output);
  } else {
    console.info(output);
  }
}

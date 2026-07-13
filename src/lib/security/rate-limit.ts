export type RateLimitRoute =
  | "auth_register"
  | "auth_login"
  | "auth_session"
  | "auth_logout"
  | "account_delete"
  | "assessment_estimate"
  | "assessment_start"
  | "assessment_answer"
  | "assessment_pause"
  | "assessment_resume"
  | "assessment_complete"
  | "assessment_clarifier"
  | "result_share"
  | "result_export"
  | "result_delete"
  | "result_feedback";

export type FixedWindow = {
  retryAfterSeconds: number;
  windowStart: Date;
};

export function getFixedWindow(windowMs: number, now = new Date()): FixedWindow {
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new RangeError("Rate-limit window must be a positive integer.");
  }

  const windowStartMs = Math.floor(now.getTime() / windowMs) * windowMs;
  const windowEndMs = windowStartMs + windowMs;

  return {
    retryAfterSeconds: Math.max(1, Math.ceil((windowEndMs - now.getTime()) / 1_000)),
    windowStart: new Date(windowStartMs),
  };
}

export function isRateLimitAllowed(count: number, limit: number): boolean {
  return Number.isSafeInteger(count) && Number.isSafeInteger(limit) && count <= limit;
}

export function getRequestRateLimitIdentity(request: Request): string {
  // Only Vercel-controlled deployments normalize x-forwarded-for before this handler.
  // Self-hosted deployments deliberately use a stable fallback until trusted proxy handling is configured.
  if (process.env.VERCEL === "1") {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const firstAddress = forwardedFor?.split(",")[0]?.trim();
    if (firstAddress) {
      return firstAddress;
    }
  }

  return "unknown";
}

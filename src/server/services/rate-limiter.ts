import "server-only";

import { hashOpaqueToken } from "@/lib/security/tokens";
import { getFixedWindow, isRateLimitAllowed, type RateLimitRoute } from "@/lib/security/rate-limit";
import { incrementRateLimit } from "@/server/repositories/rate-limits";

export type RateLimitPolicy = {
  limit: number;
  routeKey: RateLimitRoute;
  windowMs: number;
};

export const authRateLimitPolicies = {
  accountDelete: { limit: 5, routeKey: "account_delete", windowMs: 15 * 60 * 1_000 },
  login: { limit: 5, routeKey: "auth_login", windowMs: 15 * 60 * 1_000 },
  logout: { limit: 30, routeKey: "auth_logout", windowMs: 15 * 60 * 1_000 },
  register: { limit: 3, routeKey: "auth_register", windowMs: 60 * 60 * 1_000 },
  session: { limit: 300, routeKey: "auth_session", windowMs: 15 * 60 * 1_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export const assessmentRateLimitPolicies = {
  answer: { limit: 240, routeKey: "assessment_answer", windowMs: 15 * 60 * 1_000 },
  estimate: { limit: 60, routeKey: "assessment_estimate", windowMs: 15 * 60 * 1_000 },
  pause: { limit: 30, routeKey: "assessment_pause", windowMs: 15 * 60 * 1_000 },
  resume: { limit: 30, routeKey: "assessment_resume", windowMs: 15 * 60 * 1_000 },
  complete: { limit: 10, routeKey: "assessment_complete", windowMs: 15 * 60 * 1_000 },
  resultDelete: { limit: 10, routeKey: "result_delete", windowMs: 15 * 60 * 1_000 },
  resultExport: { limit: 30, routeKey: "result_export", windowMs: 15 * 60 * 1_000 },
  resultFeedback: { limit: 10, routeKey: "result_feedback", windowMs: 60 * 60 * 1_000 },
  share: { limit: 20, routeKey: "result_share", windowMs: 15 * 60 * 1_000 },
  start: { limit: 10, routeKey: "assessment_start", windowMs: 60 * 60 * 1_000 },
} as const satisfies Record<string, RateLimitPolicy>;

export async function consumeRateLimit(
  identity: string,
  policy: RateLimitPolicy,
  secret: string,
  now = new Date(),
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const window = getFixedWindow(policy.windowMs, now);
  const keyHash = hashOpaqueToken(`${policy.routeKey}:${identity}`, secret);
  const count = await incrementRateLimit({
    keyHash,
    routeKey: policy.routeKey,
    windowStart: window.windowStart,
  });

  return {
    allowed: isRateLimitAllowed(count, policy.limit),
    retryAfterSeconds: window.retryAfterSeconds,
  };
}

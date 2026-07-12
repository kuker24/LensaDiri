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
  login: { limit: 5, routeKey: "auth_login", windowMs: 15 * 60 * 1_000 },
  logout: { limit: 30, routeKey: "auth_logout", windowMs: 15 * 60 * 1_000 },
  register: { limit: 3, routeKey: "auth_register", windowMs: 60 * 60 * 1_000 },
  session: { limit: 60, routeKey: "auth_session", windowMs: 15 * 60 * 1_000 },
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

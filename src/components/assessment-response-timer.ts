export const MAX_RESPONSE_TIME_MS = 3_600_000;

export function boundedResponseTimeMs(startedAt: number, now = Date.now()): number {
  return Math.min(MAX_RESPONSE_TIME_MS, Math.max(0, Math.round(now - startedAt)));
}

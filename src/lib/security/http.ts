import type { ZodType } from "zod";

export const MAX_AUTH_BODY_BYTES = 4_096;

export type ParsedRequest<T> =
  { success: true; data: T } | { success: false; reason: "invalid_body" | "body_too_large" };

export async function parseJsonRequest<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<ParsedRequest<T>> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_AUTH_BODY_BYTES) {
    return { success: false, reason: "body_too_large" };
  }

  let payload: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_AUTH_BODY_BYTES) {
      return { success: false, reason: "body_too_large" };
    }
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return { success: false, reason: "invalid_body" };
  }

  const result = schema.safeParse(payload);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, reason: "invalid_body" };
}

export function getCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const item of cookieHeader.split(";")) {
    const separator = item.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const cookieName = item.slice(0, separator).trim();
    if (cookieName === name) {
      return item.slice(separator + 1).trim();
    }
  }

  return undefined;
}

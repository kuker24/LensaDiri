import "server-only";

import { DatabaseError } from "@/lib/db/errors";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: string } };

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function apiFailure(code: string): ApiFailure {
  return { success: false, error: { code } };
}

export function getDatabaseFailureStatus(error: unknown): 503 | 500 {
  return error instanceof DatabaseError && error.kind === "unavailable" ? 503 : 500;
}

export const noStoreHeaders = { "Cache-Control": "no-store" };

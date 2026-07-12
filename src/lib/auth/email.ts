import { z } from "zod";

export const EMAIL_MAX_LENGTH = 254;

export const emailSchema = z.string().trim().min(1).max(EMAIL_MAX_LENGTH).email();

export function normalizeEmail(email: string): string {
  return emailSchema.parse(email).toLowerCase();
}

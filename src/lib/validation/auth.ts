import { z } from "zod";

import { emailSchema } from "@/lib/auth/email";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

const redirectPathSchema = z
  .string()
  .max(2_048)
  .refine(
    (value) => value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"),
    "Redirect must be an internal path.",
  );

const recoveryTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/u);

const credentialsSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    redirectTo: redirectPathSchema.optional(),
  })
  .strict();

export const registerRequestSchema = credentialsSchema;
export const loginRequestSchema = credentialsSchema;
export const deleteAccountRequestSchema = z
  .object({
    confirmation: z.literal("HAPUS AKUN"),
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  })
  .strict();
export const recoveryRequestSchema = z.object({ email: emailSchema }).strict();
export const verifyEmailRequestSchema = z.object({ token: recoveryTokenSchema }).strict();
export const resetPasswordRequestSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    token: recoveryTokenSchema,
  })
  .strict();

export type AuthCredentialsInput = z.infer<typeof credentialsSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountRequestSchema>;

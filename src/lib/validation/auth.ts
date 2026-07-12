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

const credentialsSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    redirectTo: redirectPathSchema.optional(),
  })
  .strict();

export const registerRequestSchema = credentialsSchema;
export const loginRequestSchema = credentialsSchema;

export type AuthCredentialsInput = z.infer<typeof credentialsSchema>;

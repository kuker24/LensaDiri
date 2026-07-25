import { z } from "zod";

const secretSchema = z.string().min(32);

const optionalFlagSchema = z
  .enum(["0", "1", "false", "true"])
  .optional()
  .transform((value) => value === "1" || value === "true");

// Accept plain email or RFC-style "Name <email@domain>" for Resend from addresses.
const emailFromSchema = z
  .string()
  .min(3)
  .max(320)
  .refine((value) => {
    const angle = value.match(/<([^>]+)>/);
    const candidate = (angle?.[1] ?? value).trim();
    return z.string().email().safeParse(candidate).success;
  }, "EMAIL_FROM must be an email or Name <email> address.");

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const rawServerEnvironmentSchema = z.object({
  AUTH_SESSION_SECRET: secretSchema,
  CRON_SECRET: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  CSRF_SECRET: secretSchema,
  DATABASE_URL: z.string().url(),
  // Optional; transport stays disabled until both RESEND_API_KEY and EMAIL_FROM are set.
  EMAIL_FROM: z.preprocess(emptyToUndefined, emailFromSchema.optional()),
  FEATURE_REQUIRE_EMAIL_VERIFICATION: z.preprocess(emptyToUndefined, optionalFlagSchema),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  RATE_LIMIT_SECRET: secretSchema,
  // Optional provider secret; min length only when present. Never required for boot.
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  TOKEN_HASH_PEPPER: secretSchema,
});

export type ServerEnvironment = {
  authSessionSecret: string;
  cronSecret: string | null;
  csrfSecret: string;
  databaseUrl: string;
  emailFrom: string | null;
  isProduction: boolean;
  rateLimitSecret: string;
  requireEmailVerification: boolean;
  resendApiKey: string | null;
  tokenHashPepper: string;
  appOrigin: string;
};

function toAppOrigin(value: string): string {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_APP_URL must contain an origin only.");
  }

  return url.origin;
}

export function parseServerEnvironment(
  source: Record<string, string | undefined>,
  nodeEnv = "development",
): ServerEnvironment {
  const parsed = rawServerEnvironmentSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error("Server environment configuration is invalid.");
  }

  let appOrigin: string;
  try {
    appOrigin = toAppOrigin(parsed.data.NEXT_PUBLIC_APP_URL);
  } catch {
    throw new Error("Server environment configuration is invalid.");
  }

  return {
    authSessionSecret: parsed.data.AUTH_SESSION_SECRET,
    cronSecret: parsed.data.CRON_SECRET ?? null,
    csrfSecret: parsed.data.CSRF_SECRET,
    databaseUrl: parsed.data.DATABASE_URL,
    emailFrom: parsed.data.EMAIL_FROM ?? null,
    isProduction: nodeEnv === "production",
    rateLimitSecret: parsed.data.RATE_LIMIT_SECRET,
    requireEmailVerification: parsed.data.FEATURE_REQUIRE_EMAIL_VERIFICATION ?? false,
    resendApiKey: parsed.data.RESEND_API_KEY ?? null,
    tokenHashPepper: parsed.data.TOKEN_HASH_PEPPER,
    appOrigin,
  };
}

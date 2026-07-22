import { z } from "zod";

const secretSchema = z.string().min(32);

const rawServerEnvironmentSchema = z.object({
  AUTH_SESSION_SECRET: secretSchema,
  CRON_SECRET: z.string().min(16).optional(),
  CSRF_SECRET: secretSchema,
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  RATE_LIMIT_SECRET: secretSchema,
  TOKEN_HASH_PEPPER: secretSchema,
});

export type ServerEnvironment = {
  authSessionSecret: string;
  cronSecret: string | null;
  csrfSecret: string;
  databaseUrl: string;
  isProduction: boolean;
  rateLimitSecret: string;
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
    isProduction: nodeEnv === "production",
    rateLimitSecret: parsed.data.RATE_LIMIT_SECRET,
    tokenHashPepper: parsed.data.TOKEN_HASH_PEPPER,
    appOrigin,
  };
}

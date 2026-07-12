const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required for integration tests. Start local Supabase, run npm run db:reset, then set TEST_DATABASE_URL.",
  );
}

process.env.DATABASE_URL = databaseUrl;
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.AUTH_SESSION_SECRET = "integration-auth-secret-with-at-least-32-chars";
process.env.CSRF_SECRET = "integration-csrf-secret-with-at-least-32-chars";
process.env.TOKEN_HASH_PEPPER = "integration-token-pepper-with-at-least-32-chars";
process.env.RATE_LIMIT_SECRET = "integration-rate-limit-secret-with-at-least-32-chars";

import { defineConfig, devices } from "@playwright/test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required for Playwright. Start local Supabase, reset it, then export TEST_DATABASE_URL.",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  // Lifecycle specs share one disposable DB and intentionally exercise global fallback rate limits.
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        extraHTTPHeaders: { "x-forwarded-for": "192.0.2.10" },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 5"],
        extraHTTPHeaders: { "x-forwarded-for": "192.0.2.20" },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    env: {
      ...process.env,
      AUTH_SESSION_SECRET: "e2e-auth-session-secret-at-least-32-characters",
      CSRF_SECRET: "e2e-csrf-secret-at-least-32-characters",
      DATABASE_URL: testDatabaseUrl,
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
      RATE_LIMIT_SECRET: "e2e-rate-limit-secret-at-least-32-characters",
      RECOVERY_TEST_TRANSPORT: "1",
      TEST_DATABASE_URL: testDatabaseUrl,
      TOKEN_HASH_PEPPER: "e2e-token-hash-pepper-at-least-32-characters",
      VERCEL: "1",
    },
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

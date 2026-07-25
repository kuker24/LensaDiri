import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "@/lib/db/env-schema";

const validEnvironment = {
  AUTH_SESSION_SECRET: "a".repeat(32),
  CSRF_SECRET: "b".repeat(32),
  DATABASE_URL: "postgresql://postgres:postgres@localhost:54322/postgres",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  RATE_LIMIT_SECRET: "c".repeat(32),
  TOKEN_HASH_PEPPER: "d".repeat(32),
};

describe("server environment validation", () => {
  it("parses server-only settings lazily with derived origin", () => {
    expect(parseServerEnvironment(validEnvironment)).toMatchObject({
      appOrigin: "http://localhost:3000",
      isProduction: false,
    });
  });

  it("rejects missing secrets and app URL paths", () => {
    expect(() => parseServerEnvironment({ ...validEnvironment, CSRF_SECRET: "short" })).toThrow(
      "Server environment configuration is invalid.",
    );
    expect(() =>
      parseServerEnvironment({
        ...validEnvironment,
        NEXT_PUBLIC_APP_URL: "http://localhost:3000/path",
      }),
    ).toThrow("Server environment configuration is invalid.");
  });

  it("keeps recovery provider and mandatory verification optional and off by default", () => {
    expect(parseServerEnvironment(validEnvironment)).toMatchObject({
      emailFrom: null,
      requireEmailVerification: false,
      resendApiKey: null,
    });
    expect(
      parseServerEnvironment({
        ...validEnvironment,
        EMAIL_FROM: "LensaDiri <noreply@mail.example.com>",
        FEATURE_REQUIRE_EMAIL_VERIFICATION: "1",
        RESEND_API_KEY: "re_test_key_at_least_20_chars",
      }),
    ).toMatchObject({
      emailFrom: "LensaDiri <noreply@mail.example.com>",
      requireEmailVerification: true,
      resendApiKey: "re_test_key_at_least_20_chars",
    });
    expect(
      parseServerEnvironment({
        ...validEnvironment,
        EMAIL_FROM: "",
        FEATURE_REQUIRE_EMAIL_VERIFICATION: "",
        RESEND_API_KEY: "",
      }),
    ).toMatchObject({
      emailFrom: null,
      requireEmailVerification: false,
      resendApiKey: null,
    });
  });
});

import { describe, expect, it } from "vitest";

import { parseJsonRequest } from "@/lib/security/http";
import { loginRequestSchema } from "@/lib/validation/auth";

describe("authentication request validation", () => {
  it("accepts bounded credentials with no extra fields", async () => {
    const request = new Request("http://localhost:3000/api/auth/login", {
      body: JSON.stringify({ email: "person@example.com", password: "twelve chars+" }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    await expect(parseJsonRequest(request, loginRequestSchema)).resolves.toEqual({
      data: { email: "person@example.com", password: "twelve chars+" },
      success: true,
    });
  });

  it("rejects malformed, oversized, and extra-field request bodies", async () => {
    const malformed = new Request("http://localhost:3000/api/auth/login", {
      body: "{",
      method: "POST",
    });
    const extraField = new Request("http://localhost:3000/api/auth/login", {
      body: JSON.stringify({
        email: "person@example.com",
        password: "twelve chars+",
        role: "admin",
      }),
      method: "POST",
    });
    const oversized = new Request("http://localhost:3000/api/auth/login", {
      body: JSON.stringify({ email: "person@example.com", password: "twelve chars+" }),
      headers: { "content-length": "4097" },
      method: "POST",
    });

    await expect(parseJsonRequest(malformed, loginRequestSchema)).resolves.toEqual({
      reason: "invalid_body",
      success: false,
    });
    await expect(parseJsonRequest(extraField, loginRequestSchema)).resolves.toEqual({
      reason: "invalid_body",
      success: false,
    });
    await expect(parseJsonRequest(oversized, loginRequestSchema)).resolves.toEqual({
      reason: "body_too_large",
      success: false,
    });
  });
});

import { describe, expect, it } from "vitest";

import { parseJsonRequest } from "@/lib/security/http";
import {
  answerAssessmentSchema,
  startAssessmentSchema,
  tokenRequestSchema,
} from "@/lib/validation/assessment";
import { deleteAccountRequestSchema, loginRequestSchema } from "@/lib/validation/auth";

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

  it("accepts account deletion only with exact confirmation and a bounded password", async () => {
    const valid = deleteAccountRequestSchema.safeParse({
      confirmation: "HAPUS AKUN",
      password: "twelve chars+",
    });
    const wrongConfirmation = deleteAccountRequestSchema.safeParse({
      confirmation: "hapus akun",
      password: "twelve chars+",
    });
    const extraField = deleteAccountRequestSchema.safeParse({
      confirmation: "HAPUS AKUN",
      password: "twelve chars+",
      accountId: "attacker-controlled",
    });

    expect(valid.success).toBe(true);
    expect(wrongConfirmation.success).toBe(false);
    expect(extraField.success).toBe(false);
  });

  it("strictly validates assessment consent, opaque token, UUID, and Likert value", () => {
    const token = "a".repeat(43);
    expect(startAssessmentSchema.safeParse({ consent: true, mode: "quick" }).success).toBe(true);
    expect(startAssessmentSchema.safeParse({ consent: false, mode: "quick" }).success).toBe(false);
    expect(tokenRequestSchema.safeParse({ token }).success).toBe(true);
    expect(tokenRequestSchema.safeParse({ token: "short" }).success).toBe(false);
    expect(
      answerAssessmentSchema.safeParse({
        idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
        questionId: "550e8400-e29b-41d4-a716-446655440001",
        token,
        value: 5,
      }).success,
    ).toBe(true);
    expect(
      answerAssessmentSchema.safeParse({
        idempotencyKey: "not-uuid",
        questionId: "550e8400-e29b-41d4-a716-446655440001",
        token,
        value: 6,
      }).success,
    ).toBe(false);
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

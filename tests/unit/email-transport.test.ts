import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  clearTestRecoveryDeliveries,
  getRecoveryEmailTransport,
  readTestRecoveryDelivery,
} from "@/server/email-transport";

describe("recovery email transport", () => {
  afterEach(() => {
    clearTestRecoveryDeliveries();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses in-memory test transport only when non-production and flag is set", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RECOVERY_TEST_TRANSPORT", "1");

    const transport = getRecoveryEmailTransport();
    expect(transport.enabled).toBe(true);
    await transport.send({
      email: "user@example.com",
      purpose: "password_reset",
      token: "opaque-token-value",
    });
    expect(readTestRecoveryDelivery("user@example.com", "password_reset")).toEqual({
      email: "user@example.com",
      purpose: "password_reset",
      token: "opaque-token-value",
    });
  });

  it("stays disabled without provider credentials", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RECOVERY_TEST_TRANSPORT", "1");
    vi.stubEnv("RESEND_API_KEY", undefined);
    vi.stubEnv("EMAIL_FROM", undefined);

    const transport = getRecoveryEmailTransport();
    expect(transport.enabled).toBe(false);
  });

  it("sends via Resend when API key, from, and app origin are configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RECOVERY_TEST_TRANSPORT", undefined);
    vi.stubEnv("RESEND_API_KEY", "re_test_key_at_least_20_chars");
    vi.stubEnv("EMAIL_FROM", "LensaDiri <noreply@mail.example.com>");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lensadiri.example");

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const transport = getRecoveryEmailTransport();
    expect(transport.enabled).toBe(true);
    await transport.send({
      email: "member@example.com",
      purpose: "email_verification",
      token: "raw-token-not-for-logs",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer re_test_key_at_least_20_chars",
      "Content-Type": "application/json",
    });
    const body = JSON.parse(String(init.body)) as {
      from: string;
      subject: string;
      text: string;
      to: string[];
    };
    expect(body.from).toBe("LensaDiri <noreply@mail.example.com>");
    expect(body.to).toEqual(["member@example.com"]);
    expect(body.subject).toContain("Verifikasi");
    expect(body.text).toContain(
      "https://lensadiri.example/verify-email#token=raw-token-not-for-logs",
    );
    expect(body.text).not.toMatch(/re_test_key/);
  });

  it("fails closed when provider returns non-OK without exposing body", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_test_key_at_least_20_chars");
    vi.stubEnv("EMAIL_FROM", "noreply@mail.example.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://lensadiri.example");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "must-not-surface",
      }),
    );

    const transport = getRecoveryEmailTransport();
    await expect(
      transport.send({
        email: "member@example.com",
        purpose: "password_reset",
        token: "token-value",
      }),
    ).rejects.toThrow(/429/);
  });
});

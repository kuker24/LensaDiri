import "server-only";

import type { RecoveryPurpose } from "@/server/repositories/account-recovery";

export type RecoveryDelivery = {
  email: string;
  purpose: RecoveryPurpose;
  token: string;
};

export interface RecoveryEmailTransport {
  readonly enabled: boolean;
  send(input: RecoveryDelivery): Promise<void>;
}

class DisabledRecoveryEmailTransport implements RecoveryEmailTransport {
  readonly enabled = false;

  async send(): Promise<void> {
    throw new Error("Recovery email transport is disabled.");
  }
}

class TestRecoveryEmailTransport implements RecoveryEmailTransport {
  readonly enabled = true;

  async send(input: RecoveryDelivery): Promise<void> {
    const store = getTestStore();
    store.set(`${input.purpose}:${input.email}`, { ...input });
  }
}

class ResendRecoveryEmailTransport implements RecoveryEmailTransport {
  readonly enabled = true;

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly appOrigin: string,
  ) {}

  async send(input: RecoveryDelivery): Promise<void> {
    const path = input.purpose === "email_verification" ? "/verify-email" : "/reset-password";
    const actionUrl = `${this.appOrigin}${path}#token=${encodeURIComponent(input.token)}`;
    const subject =
      input.purpose === "email_verification"
        ? "Verifikasi email LensaDiri"
        : "Reset password LensaDiri";
    const text =
      input.purpose === "email_verification"
        ? [
            "Verifikasi email akun LensaDiri.",
            "",
            "Buka tautan ini dalam 30 menit (sekali pakai):",
            actionUrl,
            "",
            "Abaikan pesan ini jika kamu tidak meminta verifikasi.",
          ].join("\n")
        : [
            "Reset password akun LensaDiri.",
            "",
            "Buka tautan ini dalam 30 menit (sekali pakai):",
            actionUrl,
            "",
            "Setelah password diganti, semua session lama dicabut.",
            "Abaikan pesan ini jika kamu tidak meminta reset.",
          ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from: this.from,
        subject,
        text,
        to: [input.email],
      }),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      // Never include response body: provider may echo recipient or message content.
      throw new Error(`Recovery email provider rejected the request (${response.status}).`);
    }
  }
}

type RecoveryTestStore = Map<string, RecoveryDelivery>;

const globalRecoveryStore = globalThis as typeof globalThis & {
  __lensadiriRecoveryDeliveries?: RecoveryTestStore;
};

function getTestStore(): RecoveryTestStore {
  globalRecoveryStore.__lensadiriRecoveryDeliveries ??= new Map();
  return globalRecoveryStore.__lensadiriRecoveryDeliveries;
}

function resolveAppOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getRecoveryEmailTransport(): RecoveryEmailTransport {
  if (process.env.NODE_ENV !== "production" && process.env.RECOVERY_TEST_TRANSPORT === "1") {
    return new TestRecoveryEmailTransport();
  }

  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const appOrigin = resolveAppOrigin();
  // Live delivery requires all three. Missing any value keeps recovery dormant (fail closed).
  if (apiKey.length >= 20 && from.includes("@") && appOrigin) {
    return new ResendRecoveryEmailTransport(apiKey, from, appOrigin);
  }

  return new DisabledRecoveryEmailTransport();
}

export function readTestRecoveryDelivery(
  email: string,
  purpose: RecoveryPurpose,
): RecoveryDelivery | null {
  if (process.env.NODE_ENV === "production" || process.env.RECOVERY_TEST_TRANSPORT !== "1") {
    return null;
  }
  return getTestStore().get(`${purpose}:${email}`) ?? null;
}

export function clearTestRecoveryDeliveries(): void {
  if (process.env.NODE_ENV !== "production") getTestStore().clear();
}

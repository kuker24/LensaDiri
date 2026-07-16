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

type RecoveryTestStore = Map<string, RecoveryDelivery>;

const globalRecoveryStore = globalThis as typeof globalThis & {
  __lensadiriRecoveryDeliveries?: RecoveryTestStore;
};

function getTestStore(): RecoveryTestStore {
  globalRecoveryStore.__lensadiriRecoveryDeliveries ??= new Map();
  return globalRecoveryStore.__lensadiriRecoveryDeliveries;
}

export function getRecoveryEmailTransport(): RecoveryEmailTransport {
  return process.env.NODE_ENV !== "production" && process.env.RECOVERY_TEST_TRANSPORT === "1"
    ? new TestRecoveryEmailTransport()
    : new DisabledRecoveryEmailTransport();
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

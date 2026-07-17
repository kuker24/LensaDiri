import argon2 from "argon2";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const argon2idOptions = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
} as const;

// Fixed Argon2id value prevents a missing account from bypassing password work.
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$wqkixHDXnSyKIlbB737Q3A$GWVFv2W2Kdbb/G+FDUTt20Kwa2p7s5ly7rijMWzDfog";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, argon2idOptions);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function verifyDummyPassword(password: string): Promise<void> {
  await verifyPassword(DUMMY_PASSWORD_HASH, password);
}

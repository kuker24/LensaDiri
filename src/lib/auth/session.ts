export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1_000;

export type AccountSessionStatus = "active" | "suspended" | "deleted";

export type SessionActivity = {
  accountStatus: AccountSessionStatus;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type SessionCookie = {
  name: string;
  value: string;
  options: {
    expires: Date;
    httpOnly: true;
    maxAge: number;
    path: "/";
    sameSite: "lax";
    secure: boolean;
  };
};

export function isSessionActive(session: SessionActivity, now = new Date()): boolean {
  return (
    session.accountStatus === "active" && session.revokedAt === null && session.expiresAt > now
  );
}

export function getSessionCookieName(isProduction: boolean): string {
  return isProduction ? "__Host-lensadiri_session" : "lensadiri_session";
}

export function createSessionCookie(
  token: string,
  expiresAt: Date,
  isProduction: boolean,
): SessionCookie {
  const now = Date.now();

  return {
    name: getSessionCookieName(isProduction),
    value: token,
    options: {
      expires: expiresAt,
      httpOnly: true,
      maxAge: Math.max(0, Math.floor((expiresAt.getTime() - now) / 1_000)),
      path: "/",
      sameSite: "lax",
      secure: isProduction,
    },
  };
}

export function createClearedSessionCookie(isProduction: boolean): SessionCookie {
  return {
    name: getSessionCookieName(isProduction),
    value: "",
    options: {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: isProduction,
    },
  };
}

export function isOpaqueSessionToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/u.test(token);
}

"use client";

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: { code: string } };

type SessionBootstrap = {
  authenticated: boolean;
  csrfToken: string;
};

export class AuthApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AuthApiError";
  }
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!payload || typeof payload !== "object" || !("success" in payload)) {
    throw new AuthApiError("invalid_response");
  }
  return payload;
}

export async function getSessionBootstrap(): Promise<SessionBootstrap> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "same-origin",
  });
  const envelope = await parseEnvelope<SessionBootstrap>(response);
  if (!response.ok || !envelope.success) {
    throw new AuthApiError(envelope.success ? "request_failed" : envelope.error.code);
  }
  return envelope.data;
}

export async function postAuthenticatedMutation<T>(
  path: string,
  body?: Readonly<Record<string, unknown>>,
): Promise<T> {
  const { csrfToken } = await getSessionBootstrap();
  const requestInit: RequestInit = {
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    method: "POST",
  };
  if (body) {
    requestInit.body = JSON.stringify(body);
  }
  const response = await fetch(path, requestInit);
  const envelope = await parseEnvelope<T>(response);
  if (!response.ok || !envelope.success) {
    throw new AuthApiError(envelope.success ? "request_failed" : envelope.error.code);
  }
  return envelope.data;
}

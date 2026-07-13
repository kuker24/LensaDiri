"use client";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import type {
  AssessmentMode,
  AssessmentSessionView,
  ResultView,
} from "@/server/repositories/assessment";

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string } };

async function getEnvelope<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin" });
  const payload = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new AuthApiError(payload && !payload.success ? payload.error.code : "request_failed");
  }
  return payload.data;
}

export async function startAssessment(mode: AssessmentMode): Promise<string> {
  const data = await postAuthenticatedMutation<{ token: string }>("/api/assessment/start", {
    consent: true,
    mode,
  });
  return data.token;
}

export function getAssessmentSession(token: string): Promise<AssessmentSessionView> {
  return getEnvelope(`/api/assessment/session/${encodeURIComponent(token)}`);
}

export async function saveAnswer(input: {
  idempotencyKey: string;
  questionId: string;
  responseTimeMs: number;
  token: string;
  value: number;
}): Promise<void> {
  await postAuthenticatedMutation("/api/assessment/answer", input);
}

export async function completeAssessment(token: string): Promise<string> {
  const data = await postAuthenticatedMutation<{ resultToken: string }>(
    "/api/assessment/complete",
    { token },
  );
  return data.resultToken;
}

export function getPrivateResult(token: string): Promise<ResultView> {
  return getEnvelope(`/api/result/${encodeURIComponent(token)}`);
}

export function getSharedResult(token: string): Promise<ResultView> {
  return getEnvelope(`/api/shared/${encodeURIComponent(token)}`);
}

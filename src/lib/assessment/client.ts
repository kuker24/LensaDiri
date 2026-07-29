"use client";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import type {
  AssessmentMode,
  AssessmentSessionView,
  ClarifierSessionView,
  PrivateResultView,
} from "@/server/repositories/assessment";
import type { SafeSharedResultView } from "@/server/repositories/result-views";
import type {
  AssessmentModeProfile,
  AssessmentModuleDefinition,
  AssessmentSelectionInput,
  ComboPresetDefinition,
} from "@/lib/assessment/catalog";
import type { AssessmentEstimate } from "@/lib/assessment/estimate";

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string } };

const CATALOG_FETCH_TIMEOUT_MS = 12_000;

async function getEnvelope<T>(path: string, options?: { timeoutMs?: number }): Promise<T> {
  const timeoutMs = options?.timeoutMs;
  const controller = timeoutMs === undefined ? null : new AbortController();
  const timeout =
    controller && timeoutMs !== undefined
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;
  try {
    const response = await fetch(path, {
      cache: "no-store",
      credentials: "same-origin",
      ...(controller ? { signal: controller.signal } : {}),
    });
    const payload = (await response.json().catch(() => null)) as Envelope<T> | null;
    if (!response.ok || !payload?.success) {
      throw new AuthApiError(payload && !payload.success ? payload.error.code : "request_failed");
    }
    return payload.data;
  } catch (error) {
    if (error instanceof AuthApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AuthApiError("request_failed");
    }
    throw new AuthApiError("request_failed");
  } finally {
    if (timeout !== null) window.clearTimeout(timeout);
  }
}

export type AssessmentCatalog = {
  modes: AssessmentModeProfile[];
  modules: AssessmentModuleDefinition[];
};

type AssessmentCatalogResponse = AssessmentCatalog & {
  combos: ComboPresetDefinition[];
};

export async function startAssessment(mode: AssessmentMode): Promise<string> {
  const data = await postAuthenticatedMutation<{ token: string }>("/api/assessment/start", {
    consent: true,
    mode,
  });
  return data.token;
}

export async function startModularAssessment(selection: AssessmentSelectionInput): Promise<string> {
  const data = await postAuthenticatedMutation<{ token: string }>("/api/assessment/start", {
    ...selection,
    consent: true,
    locale: "id",
  });
  return data.token;
}

export function getAssessmentCatalog(): Promise<AssessmentCatalogResponse> {
  return getEnvelope("/api/modules", { timeoutMs: CATALOG_FETCH_TIMEOUT_MS });
}

export async function getComboCatalog(): Promise<ComboPresetDefinition[]> {
  const data = await getEnvelope<{ combos: ComboPresetDefinition[] }>("/api/combos", {
    timeoutMs: CATALOG_FETCH_TIMEOUT_MS,
  });
  return data.combos;
}

export async function estimateModularAssessment(
  selection: AssessmentSelectionInput,
): Promise<AssessmentEstimate> {
  return postAuthenticatedMutation<AssessmentEstimate>("/api/assessment/estimate", {
    ...selection,
  });
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

export type CompletionResult = { kind: "result"; resultToken: string } | { kind: "clarifier" };

export async function completeAssessment(token: string): Promise<CompletionResult> {
  const data = await postAuthenticatedMutation<
    { resultToken: string } | { status: "clarifier_required" }
  >("/api/assessment/complete", { token });
  return "resultToken" in data
    ? { kind: "result", resultToken: data.resultToken }
    : { kind: "clarifier" };
}

export function pauseAssessment(token: string): Promise<{ status: "paused" }> {
  return postAuthenticatedMutation("/api/assessment/pause", { token });
}

export function resumeAssessment(token: string): Promise<{ status: "active" }> {
  return postAuthenticatedMutation("/api/assessment/resume", { token });
}

export function startAssessmentClarifier(token: string): Promise<ClarifierSessionView> {
  return postAuthenticatedMutation("/api/assessment/clarifier", { action: "start", token });
}

export async function saveClarifierAssessmentAnswer(input: {
  questionId: string;
  responseTimeMs: number;
  token: string;
  value: number;
}): Promise<void> {
  await postAuthenticatedMutation("/api/assessment/clarifier", { action: "answer", ...input });
}

export async function resolveAssessmentClarifier(
  token: string,
  action: "complete" | "skip",
): Promise<string> {
  const data = await postAuthenticatedMutation<{ resultToken: string }>(
    "/api/assessment/clarifier",
    { action, token },
  );
  return data.resultToken;
}

export function getPrivateResult(token: string): Promise<PrivateResultView> {
  return getEnvelope(`/api/result/${encodeURIComponent(token)}`);
}

export function getSharedResult(token: string): Promise<SafeSharedResultView> {
  return getEnvelope(`/api/shared/${encodeURIComponent(token)}`);
}

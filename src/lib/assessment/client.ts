"use client";

import { AuthApiError, postAuthenticatedMutation } from "@/lib/auth/client";
import { identityJourneyModuleKeys } from "@/lib/assessment/identity-journey";
import type {
  AssessmentSessionView,
  ClarifierSessionView,
  PrivateResultView,
} from "@/server/repositories/assessment";
import type { SafeSharedResultView } from "@/server/repositories/result-views";
import type { IdentityJourneyView } from "@/server/repositories/identity-journeys";
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

/**
 * Starts the whole five-lens journey as one Complex sitting.
 *
 * The server re-checks every field here, so this payload is a convenience, not
 * the contract. `experimentalAcknowledged` must be true because four of the five
 * lenses are experimental, and `age` must clear 18 because `psychosophy` is an
 * 18+ module.
 */
export async function startIdentityJourney(input: {
  age: number;
  characterGender: "perempuan" | "laki";
}): Promise<{ journeyToken: string; token: string }> {
  return postAuthenticatedMutation("/api/assessment/start", {
    age: input.age,
    consent: true,
    experimentalAcknowledged: true,
    journey: { characterGender: input.characterGender, combined: true, kind: "create" },
    locale: "id",
    mode: "deep",
    moduleKeys: [...identityJourneyModuleKeys],
    presetKey: null,
    selectionType: "custom_combo",
  });
}

export function getIdentityJourney(token: string): Promise<IdentityJourneyView> {
  return getEnvelope(`/api/journey/${encodeURIComponent(token)}`);
}

export function continueIdentityJourney(input: {
  age: number;
  experimentalAcknowledged: boolean;
  journeyToken: string;
}): Promise<{ moduleKey: string; token: string }> {
  return postAuthenticatedMutation("/api/journey/continue", input);
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

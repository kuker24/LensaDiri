import type { AssessmentSelectionInput } from "@/lib/assessment/catalog";
import { assessmentSelectionSchema } from "@/lib/validation/assessment";

export const assessmentSelectionStorageKey = "lensadiri:assessment-selection:v2";

export function saveAssessmentSelection(selection: AssessmentSelectionInput): void {
  sessionStorage.setItem(assessmentSelectionStorageKey, JSON.stringify(selection));
}

export function loadAssessmentSelection(): AssessmentSelectionInput | null {
  const raw = sessionStorage.getItem(assessmentSelectionStorageKey);
  if (!raw) return null;
  try {
    const parsed = assessmentSelectionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

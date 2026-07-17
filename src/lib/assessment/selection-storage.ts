import type { AssessmentSelectionInput } from "@/lib/assessment/catalog";

export const assessmentSelectionStorageKey = "lensadiri:assessment-selection:v2";

export function saveAssessmentSelection(selection: AssessmentSelectionInput): void {
  sessionStorage.setItem(assessmentSelectionStorageKey, JSON.stringify(selection));
}

export function loadAssessmentSelection(): AssessmentSelectionInput | null {
  const raw = sessionStorage.getItem(assessmentSelectionStorageKey);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<AssessmentSelectionInput>;
    if (
      !Array.isArray(value.moduleKeys) ||
      value.moduleKeys.length === 0 ||
      !["quick", "standard", "deep"].includes(value.mode ?? "") ||
      !["single", "custom_combo", "preset_combo", "full_spectrum"].includes(
        value.selectionType ?? "",
      )
    ) {
      return null;
    }
    return value as AssessmentSelectionInput;
  } catch {
    return null;
  }
}

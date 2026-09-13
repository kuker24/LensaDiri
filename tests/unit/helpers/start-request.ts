/**
 * The one request body the public start route accepts.
 *
 * `/api/assessment/start` takes a single shape: the whole five-lens journey in
 * one Complex sitting. Tests that only need "a valid start request" should build
 * it here instead of restating ten fields, so a contract change lands in one
 * place. Tests that assert on the contract itself deliberately spell the body
 * out — see `tests/unit/request-validation.test.ts`.
 */
export function combinedJourneyStartBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    age: 18,
    consent: true,
    experimentalAcknowledged: true,
    journey: { characterGender: "perempuan", combined: true, kind: "create" },
    locale: "id",
    mode: "deep",
    moduleKeys: ["type_16", "enneagram", "socionics_communication", "trait_profile", "psychosophy"],
    presetKey: null,
    selectionType: "custom_combo",
    ...overrides,
  };
}

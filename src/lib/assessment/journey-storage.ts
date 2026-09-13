"use client";

const JOURNEY_TOKEN_KEY = "lensadiri_identity_journey";
const JOURNEY_AGE_KEY = "lensadiri_identity_journey_age";

export function saveIdentityJourneyAccess(token: string, age: number): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(JOURNEY_TOKEN_KEY, token);
  window.sessionStorage.setItem(JOURNEY_AGE_KEY, String(age));
}

export function getIdentityJourneyAccess(): { age: number; token: string } | null {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(JOURNEY_TOKEN_KEY);
  const age = Number(window.sessionStorage.getItem(JOURNEY_AGE_KEY));
  return token && Number.isInteger(age) && age >= 13 && age <= 99 ? { age, token } : null;
}

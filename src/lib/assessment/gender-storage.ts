export type CharacterGender = "perempuan" | "laki";

export function getStoredGender(): CharacterGender {
  if (typeof window === "undefined") return "perempuan";
  try {
    const stored =
      sessionStorage.getItem("lensadiri_gender") || localStorage.getItem("lensadiri_gender");
    if (stored === "perempuan" || stored === "laki") return stored;
  } catch {
    // Ignore storage errors
  }
  return "perempuan";
}

export function saveStoredGender(gender: CharacterGender): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("lensadiri_gender", gender);
    localStorage.setItem("lensadiri_gender", gender);
  } catch {
    // Ignore storage errors
  }
}

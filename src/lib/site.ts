const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const siteConfig = {
  name: "LensaDiri",
  tagline: "Kenali pola dirimu lewat banyak lensa",
  description:
    "Platform eksplorasi kepribadian modular, privacy-first, dan mobile-first untuk pengguna Indonesia.",
  url: configuredUrl.replace(/\/$/, ""),
} as const;

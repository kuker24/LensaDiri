import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Next 16 only serves qualities declared here. The hero figurines ask for 100
  // because the WebP encoder degrades their alpha channel below that: at 90 it
  // rewrote 459 interior pixels of one figurine down to alpha 32, so the page
  // background bled through an eye. At 100 that damage is gone and the encoded
  // size is unchanged, since these renders are already gradient-heavy. Leaving
  // 75 in place keeps every other image on the cheaper default.
  images: { qualities: [75, 100] },
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    // The PDF cover reads the figurine PNG straight off disk, so the renders
    // have to travel with the serverless function. Without this the export
    // works locally (full repo present) and silently loses its cover art in
    // production. Only the gender-neutral renders are traced: the server never
    // learns the picked body, so the `-laki`/`-perempuan` variants are unused
    // here and would trace ~22 MB for nothing.
    "/api/result/export/[token]": ["./src/server/export/fonts/**/*", "./public/figurines/????.png"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

import type { Metadata, Viewport } from "next";
import {
  Anton,
  Archivo,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: ["/brand/favicon.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "/",
    images: [
      {
        url: "/media/design2/og-share-world.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/media/design2/og-share-world.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  // Matches --color-canvas so mobile browser chrome blends with the paper canvas.
  themeColor: "#fbf9f5",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="id"
      className={`${archivo.variable} ${jetBrainsMono.variable} ${instrumentSerif.variable} ${inter.variable} ${anton.variable} ${plusJakartaSans.variable}`}
    >
      <body>
        {/* THESIS: self-reflection unfolds like a collectible vinyl figure without turning identity into a game or revealing a type early. OWN-WORLD: warm paper gallery, tactile white vitrines, Anton packaging type, Jakarta body copy, and four contrast-safe stage colors. STORY: browse anonymous figures, choose a visual form, answer the first lens, claim the server result, then add only completed lenses. FIRST VIEWPORT: anonymous cutout carousel around a giant POLA mark, concise privacy copy below, and Mulai anchored opposite the controls. FORM: approved Stitch Vinyl Gallery collectible prototype. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
        <a
          className="focus-ring bg-surface-raised text-ink border-line sr-only z-50 rounded-[12px] border px-4 py-3 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
          href="#konten-utama"
        >
          Lewati ke konten utama
        </a>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}

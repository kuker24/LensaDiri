import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
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
  colorScheme: "dark",
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="id"
      className={`${archivo.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        {/* THESIS: many lenses form one self — a violet constellation head on pure black replaces the monochrome workshop; the category-default card grid is refused. OWN-WORLD: void black, bone type at sculptural scale, one violet pill action, saffron punctuation, hairline structure. STORY: visitor grasps private modular self-reflection in seconds, starts calmly, stays in control. FIRST VIEWPORT: nav top; giant two-line headline left; constellation head right; violet Mulai + ghost Metode; meta row beneath. FORM: Dala bank world (found-this-design pin), seed 6cb1d954 superseded by user GO. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
        <a
          className="focus-ring bg-surface-raised text-ink sr-only z-50 rounded-[12px] border border-white/20 px-4 py-3 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
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

"use client";

import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

/**
 * The header no longer carries a nav rail, so this is the only path to the
 * method, privacy, limitation, terms, and contact pages. They stay here on
 * purpose: privacy and limitation disclosure has to remain reachable.
 */
const footerLinks = [
  { label: "METODE", href: "/method" },
  { label: "PRIVASI", href: "/privacy" },
  { label: "BATASAN", href: "/disclaimer" },
  { label: "KETENTUAN", href: "/terms" },
  { label: "KONTAK", href: "/contact" },
] as const;

function ArrowUpIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

export function SiteFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-line bg-void text-ink-muted border-t font-mono text-xs">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0" idPrefix="brand-footer" />
            <span className="text-ink font-display text-base tracking-[0.18em] uppercase">
              LensaDiri
            </span>
          </div>

          <nav aria-label="Navigasi footer studio" className="flex flex-wrap gap-6">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring hover:text-ink tracking-wider uppercase transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-line text-steel mt-8 flex flex-col gap-4 border-t pt-6 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <span>Koleksi Tersimpan Otomatis · Tanpa Akun & Pelacak Iklan · Sepenuhnya privat</span>
          <button
            type="button"
            onClick={scrollToTop}
            className="focus-ring text-ink-muted hover:text-ink inline-flex min-h-[44px] w-fit min-w-[44px] cursor-pointer items-center gap-1.5 px-2 py-2 transition-colors"
          >
            <span>KEMBALI KE ATAS</span>
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </footer>
  );
}

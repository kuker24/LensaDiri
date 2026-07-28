import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

const footerLinks = [
  ["Metode", "/method"],
  ["Privasi", "/privacy"],
  ["Batas penggunaan", "/disclaimer"],
  ["Ketentuan", "/terms"],
  ["Kontak", "/contact"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/15">
      <div className="container-shell py-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <BrandMark className="text-ink mt-0.5 h-5 w-5" />
            <div>
              <p className="text-sm font-semibold tracking-[-0.02em]">LensaDiri</p>
              <p className="text-ink-muted mt-1 max-w-sm text-sm leading-6">
                Banyak lensa. Tanpa label mutlak.
              </p>
            </div>
          </div>
          <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map(([label, href]) => (
              <Link
                className="focus-ring ui-transition text-ink-muted hover:text-ink inline-flex min-h-11 items-center rounded-[12px] py-2 text-sm font-medium"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="text-ink-muted mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-4 text-xs font-medium">
          <span>Privat sejak awal · Indonesia</span>
          <span>Bukan diagnosis klinis</span>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

const footerLinks = [
  ["Metode", "/method"],
  ["Privasi", "/privacy"],
  ["Disclaimer", "/disclaimer"],
  ["Ketentuan", "/terms"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/15">
      <div className="container-shell py-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span aria-hidden="true" className="text-ink mt-0.5 text-xs">
              ◆
            </span>
            <div>
              <p className="font-mono text-xs tracking-[-0.02em]">LensaDiri</p>
              <p className="text-ink-muted mt-1 max-w-sm text-sm leading-6">
                Banyak lensa. Tanpa label mutlak.
              </p>
            </div>
          </div>
          <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map(([label, href]) => (
              <Link
                className="focus-ring text-ink-muted hover:text-ink rounded-[2px] py-2 font-mono text-[0.625rem] tracking-[-0.02em] uppercase transition-colors"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="text-ink-muted mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-4 font-mono text-[0.625rem] tracking-[-0.02em] uppercase">
          <span>Privacy-first · Indonesia</span>
          <span>Bukan diagnosis klinis</span>
        </div>
      </div>
    </footer>
  );
}

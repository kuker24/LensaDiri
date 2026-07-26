import Link from "next/link";

const footerLinks = [
  ["Metode", "/method"],
  ["Privasi", "/privacy"],
  ["Disclaimer", "/disclaimer"],
  ["Ketentuan", "/terms"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="container-shell py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-ink mt-0.5 font-mono text-sm">
              +
            </span>
            <div>
              <p className="text-sm font-medium tracking-[-0.01em]">LensaDiri</p>
              <p className="text-steel mt-1 max-w-sm text-sm leading-6">
                Banyak lensa untuk membaca pola, tanpa label mutlak.
              </p>
            </div>
          </div>
          <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {footerLinks.map(([label, href]) => (
              <Link
                className="focus-ring text-steel hover:text-ink rounded-md py-2 transition-colors"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[0.7rem] tracking-[0.12em] text-[#f0f0f0]/60 uppercase">
          <span>Privacy-first · Indonesia</span>
          <span>Bukan diagnosis klinis</span>
        </div>
      </div>
    </footer>
  );
}

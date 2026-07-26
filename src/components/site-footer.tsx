import Link from "next/link";

const footerLinks = [
  ["Metode", "/method"],
  ["Privasi", "/privacy"],
  ["Disclaimer", "/disclaimer"],
  ["Ketentuan", "/terms"],
] as const;

export function SiteFooter() {
  return (
    <footer className="border-line border-t">
      <div className="container-shell py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mono-label">Ruang refleksi pribadi</p>
            <p className="mt-3 text-lg font-medium tracking-[-0.02em]">LensaDiri</p>
            <p className="text-ink-muted mt-1 max-w-md text-sm">
              Banyak lensa untuk membaca pola, tanpa label mutlak.
            </p>
          </div>
          <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {footerLinks.map(([label, href]) => (
              <Link
                className="focus-ring text-ink-muted hover:text-ink rounded-md py-2 transition-colors"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-line text-ink-muted mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5 font-mono text-[0.65rem] tracking-[0.12em] uppercase">
          <span>Privacy-first / Indonesia</span>
          <span>Bukan diagnosis klinis</span>
        </div>
      </div>
    </footer>
  );
}

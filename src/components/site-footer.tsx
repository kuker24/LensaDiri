import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white/55">
      <div className="container-shell flex flex-col gap-6 py-10 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display font-semibold text-ink">LensaDiri</p>
          <p className="mt-1">Refleksi diri lewat banyak lensa, tanpa label mutlak.</p>
        </div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-3">
          <Link className="focus-ring rounded-sm hover:text-ink" href="/method">
            Metode
          </Link>
          <Link className="focus-ring rounded-sm hover:text-ink" href="/privacy">
            Privasi
          </Link>
          <Link className="focus-ring rounded-sm hover:text-ink" href="/disclaimer">
            Disclaimer
          </Link>
        </nav>
      </div>
    </footer>
  );
}

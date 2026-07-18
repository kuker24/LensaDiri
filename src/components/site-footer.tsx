import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-line border-t bg-white/55">
      <div className="container-shell text-ink-muted flex flex-col gap-6 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-ink font-semibold">LensaDiri</p>
          <p className="mt-1">Refleksi diri lewat banyak lensa, tanpa label mutlak.</p>
        </div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-5 gap-y-3">
          <Link className="focus-ring hover:text-ink rounded-sm" href="/method">
            Metode
          </Link>
          <Link className="focus-ring hover:text-ink rounded-sm" href="/privacy">
            Privasi
          </Link>
          <Link className="focus-ring hover:text-ink rounded-sm" href="/disclaimer">
            Disclaimer
          </Link>
        </nav>
      </div>
    </footer>
  );
}

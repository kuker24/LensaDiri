import Link from "next/link";

const navigation = [
  { href: "/method", label: "Metode" },
  { href: "/privacy", label: "Privasi" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-white/60 backdrop-blur-xl">
      <div className="container-shell flex min-h-16 items-center justify-between gap-5 py-3">
        <Link className="focus-ring flex items-center gap-3 rounded-lg font-semibold" href="/">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-teal-400 text-sm text-white shadow-md shadow-violet-500/20"
          >
            L
          </span>
          <span>LensaDiri</span>
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 text-sm md:flex">
          {navigation.map((item) => (
            <Link className="focus-ring rounded-md text-[var(--muted)] hover:text-[var(--foreground)]" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          className="focus-ring rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          href="/start"
        >
          Mulai
        </Link>
      </div>
    </header>
  );
}

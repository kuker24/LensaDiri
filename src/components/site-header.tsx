import Link from "next/link";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "/modules", label: "Modul" },
  { href: "/combos", label: "Combo" },
  { href: "/method", label: "Metode" },
  { href: "/about", label: "Tentang" },
  { href: "/blog", label: "Blog" },
  { href: "/privacy", label: "Privasi" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white/80 backdrop-blur-xl">
      <div className="container-shell flex min-h-16 flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3">
        <Link className="focus-ring flex items-center gap-2.5 rounded-sm font-semibold text-ink" href="/">
          <span
            aria-hidden="true"
            className="font-display grid h-9 w-9 place-items-center rounded-sm bg-lens text-lg font-semibold text-canvas shadow-surface"
          >
            L
          </span>
          <span className="font-display text-lg tracking-tight">LensaDiri</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" passHref legacyBehavior>
            <Button size="sm" variant="ghost">
              Masuk
            </Button>
          </Link>
          <Link href="/start" passHref legacyBehavior>
            <Button size="sm">
              Mulai
            </Button>
          </Link>
        </div>
        <nav
          aria-label="Navigasi utama"
          className="order-3 flex w-full gap-5 overflow-x-auto pb-1 text-sm md:order-none md:w-auto md:flex-1 md:justify-center md:pb-0"
        >
          {navigation.map((item) => (
            <Link
              className="focus-ring shrink-0 rounded-sm text-ink-muted transition-colors duration-150 hover:text-ink"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

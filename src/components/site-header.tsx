"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getButtonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const navigation = [
  { href: "/modules", label: "Lensa" },
  { href: "/combos", label: "Kombinasi" },
  { href: "/method", label: "Metode" },
  { href: "/about", label: "Tentang" },
  { href: "/blog", label: "Catatan" },
  { href: "/privacy", label: "Privasi" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-line bg-canvas/82 sticky top-0 z-20 border-b backdrop-blur-[10px]">
      <div className="container-shell flex min-h-18 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
        <Link className="focus-ring flex items-center gap-3 rounded-md" href="/">
          <span
            aria-hidden="true"
            className="border-lens/45 relative grid h-9 w-9 place-items-center rounded-md border"
          >
            <span className="bg-lens h-2.5 w-2.5 rounded-full" />
            <span className="border-lens/30 absolute inset-1.5 rounded-full border" />
          </span>
          <span className="text-[0.95rem] font-semibold tracking-[-0.02em]">LensaDiri</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/login" className={getButtonClassName("ghost", "sm")}>
            Masuk
          </Link>
          <Link href="/start" className={getButtonClassName("primary", "sm")}>
            Mulai refleksi
          </Link>
        </div>

        <nav
          aria-label="Navigasi utama"
          className="order-3 flex w-full gap-1 overflow-x-auto pt-1 pb-0.5 md:order-none md:w-auto md:flex-1 md:justify-center md:pt-0"
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-ring text-ink-muted hover:text-ink shrink-0 rounded-md px-2.5 py-2 text-xs font-medium transition-colors duration-150",
                  isActive && "text-ink bg-white/8",
                )}
                href={item.href}
                key={item.href}
                onFocus={(event) =>
                  event.currentTarget.scrollIntoView({
                    behavior: "auto",
                    block: "nearest",
                    inline: "center",
                  })
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

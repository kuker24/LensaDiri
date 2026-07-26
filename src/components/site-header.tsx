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
    <header className="nav-frost sticky top-0 z-20">
      <div className="container-shell flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 py-3 md:min-h-[4.25rem]">
        <Link className="focus-ring flex shrink-0 items-center gap-3 rounded-md" href="/">
          <span
            aria-hidden="true"
            className="relative grid h-8 w-8 place-items-center rounded-md border border-white/20"
          >
            <span className="bg-lens h-2 w-2 rounded-full" />
            <span className="absolute inset-1.5 rounded-full border border-white/15" />
          </span>
          <span className="text-[0.95rem] font-medium tracking-[-0.02em]">LensaDiri</span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="order-3 -mx-1 flex w-full gap-0.5 overflow-x-auto px-1 pb-0.5 md:order-none md:mx-0 md:w-auto md:flex-1 md:justify-center md:overflow-visible md:px-0 md:pb-0"
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "nav-link focus-ring text-steel hover:text-ink shrink-0 rounded-md px-2.5 py-2 transition-colors duration-150",
                  isActive && "text-ink",
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

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <Link href="/login" className={getButtonClassName("secondary", "sm")}>
            Masuk
          </Link>
          <Link href="/start" className={getButtonClassName("primary", "sm")}>
            Mulai
          </Link>
        </div>
      </div>
    </header>
  );
}

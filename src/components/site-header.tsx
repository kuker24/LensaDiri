"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getButtonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const navigation = [
  { href: "/modules", label: "Modul" },
  { href: "/combos", label: "Combo" },
  { href: "/method", label: "Metode" },
  { href: "/about", label: "Tentang" },
  { href: "/blog", label: "Blog" },
  { href: "/privacy", label: "Privasi" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-line border-b bg-white/70 backdrop-blur-[18px]">
      <div className="container-shell flex min-h-16 flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3">
        <Link
          className="focus-ring text-ink flex items-center gap-2.5 rounded-md font-semibold"
          href="/"
        >
          <span
            aria-hidden="true"
            className="bg-lens text-canvas grid h-9 w-9 place-items-center rounded-md text-lg font-semibold shadow-[0_8px_18px_rgb(101_88_217_/_0.2)]"
          >
            L
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">LensaDiri</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className={getButtonClassName("ghost", "sm")}>
            Masuk
          </Link>
          <Link href="/start" className={getButtonClassName("primary", "sm")}>
            Mulai
          </Link>
        </div>
        <nav
          aria-label="Navigasi utama"
          className="order-3 flex w-full gap-5 overflow-x-auto pb-1 text-sm md:order-none md:w-auto md:flex-1 md:justify-center md:pb-0"
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={cn(
                  "focus-ring text-ink-muted hover:text-ink relative shrink-0 rounded-md py-1 font-medium transition-colors duration-150",
                  isActive && "text-lens border-lens border-b-2 font-semibold",
                )}
                href={item.href}
                key={item.href}
                aria-current={isActive ? "page" : undefined}
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

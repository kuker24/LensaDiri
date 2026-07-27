"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { getButtonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { RouteFamily } from "@/lib/route-family";

const publicNavigation = [
  { href: "/modules", label: "Lensa" },
  { href: "/combos", label: "Kombinasi" },
  { href: "/method", label: "Metode" },
  { href: "/about", label: "Tentang" },
  { href: "/blog", label: "Catatan" },
  { href: "/privacy", label: "Privasi" },
];

const familyNavigation = {
  account: [
    { href: "/dashboard", label: "Ringkasan" },
    { href: "/dashboard/results", label: "Hasil" },
    { href: "/dashboard/privacy", label: "Privasi" },
    { href: "/dashboard/settings", label: "Pengaturan" },
  ],
  operator: [
    { href: "/admin", label: "Admin" },
    { href: "/dashboard", label: "Dashboard" },
  ],
} as const;

function BrandLink({ context }: { context?: string }) {
  return (
    <Link
      className="focus-ring flex min-h-11 shrink-0 items-center gap-2.5 rounded-[12px]"
      href="/"
    >
      <BrandMark className="text-ink h-5 w-5" />
      <span className="text-sm font-semibold tracking-[-0.02em]">LensaDiri</span>
      {context ? (
        <span className="text-ink-muted hidden text-xs font-medium sm:inline">/ {context}</span>
      ) : null}
    </Link>
  );
}

function NavigationLinks({
  items,
  pathname,
}: {
  items: readonly { href: string; label: string }[];
  pathname: string;
}) {
  return items.map((item) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "nav-link focus-ring ui-transition text-ink-muted hover:text-ink min-h-11 rounded-[12px] px-3 py-3",
          isActive && "text-ink",
        )}
        href={item.href}
        key={item.href}
      >
        {item.label}
      </Link>
    );
  });
}

export function SiteHeader({ family }: { family: RouteFamily }) {
  const pathname = usePathname();

  if (family === "auth" || family === "assessment") {
    return (
      <header className="nav-frost sticky top-0 z-20">
        <div className="container-shell flex min-h-14 items-center justify-between gap-4 py-2.5">
          <BrandLink context={family === "auth" ? "Akses akun" : "Eksplorasi"} />
          <Link className={getButtonClassName("secondary", "sm")} href="/">
            {family === "assessment" ? "Simpan & keluar" : "Beranda"}
          </Link>
        </div>
      </header>
    );
  }

  const items = family === "public" ? publicNavigation : familyNavigation[family];
  const context =
    family === "account" ? "Ruang pribadi" : family === "operator" ? "Read-only" : undefined;

  return (
    <header className="nav-frost sticky top-0 z-20">
      <div className="container-shell flex min-h-14 items-center gap-4 py-2.5">
        <BrandLink {...(context ? { context } : {})} />

        <nav
          aria-label={family === "public" ? "Navigasi utama" : "Navigasi ruang pribadi"}
          className="hidden flex-1 justify-center gap-0.5 md:flex"
        >
          <NavigationLinks items={items} pathname={pathname} />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <details className="relative md:hidden">
            <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center rounded-[12px] border border-white/35 px-4 text-sm font-medium marker:content-none">
              Menu
            </summary>
            <nav
              aria-label="Menu navigasi"
              className="nav-menu-panel bg-canvas absolute top-[calc(100%+0.5rem)] right-0 z-30 grid min-w-52 rounded-[16px] border border-white/25 p-2"
            >
              <NavigationLinks items={items} pathname={pathname} />
              {family === "public" ? (
                <Link className="focus-ring min-h-11 px-3 py-3 text-sm font-medium" href="/login">
                  Masuk
                </Link>
              ) : null}
            </nav>
          </details>
          {family === "public" ? (
            <>
              <Link
                href="/login"
                className={cn(getButtonClassName("secondary", "sm"), "hidden md:inline-flex")}
              >
                Masuk
              </Link>
              <Link href="/start" className={getButtonClassName("primary", "sm")}>
                Mulai
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

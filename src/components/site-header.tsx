"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import type { RouteFamily } from "@/lib/route-family";

const publicNavigation = [
  { href: "/method", label: "Metode" },
  { href: "/about", label: "Tentang" },
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

function ArrowUpRightIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

export function SiteHeader({ family }: { family: RouteFamily }) {
  const pathname = usePathname();

  const items =
    family === "public"
      ? publicNavigation
      : (familyNavigation[family as keyof typeof familyNavigation] ?? []);
  const context =
    family === "account" ? "Ruang pribadi" : family === "operator" ? "Hanya-baca" : undefined;

  const isLanding = pathname === "/";

  return (
    <header
      className={cn(
        "z-40 w-full transition-all duration-200",
        "text-ink",
        isLanding ? "fixed inset-x-0 top-0 border-b-0 bg-transparent" : "nav-frost sticky top-0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="focus-ring group flex min-h-11 items-center gap-2.5 rounded-sm py-1 transition-opacity hover:opacity-80"
        >
          <span className="font-['Anton',var(--font-anton),sans-serif] text-base tracking-[0.18em] uppercase">
            LENSADIRI
          </span>
          <span className="bg-iris h-2 w-2 rounded-full" />
          {context && (
            <span className="text-steel hidden font-mono text-[11px] sm:inline">/ {context}</span>
          )}
        </Link>

        {/* Center Navigation Links (Desktop) */}
        {family !== "auth" && family !== "assessment" && (
          <nav
            aria-label="Navigasi utama"
            className="border-line bg-surface hidden items-center gap-1 rounded-full border px-3.5 py-1.5 shadow-[0_2px_10px_rgb(27_28_26_/_0.06)] lg:flex"
          >
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1 font-mono text-xs tracking-wider uppercase transition-all duration-150",
                    isActive
                      ? "bg-iris text-canvas font-bold shadow-sm"
                      : "text-ink-muted hover:bg-surface-raised hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {family === "public" && (
            <>
              <Link
                href="/dashboard"
                className="focus-ring text-ink-muted hover:text-ink hidden font-mono text-xs tracking-wider uppercase transition-colors lg:inline-flex"
              >
                Ruang pribadi
              </Link>
              <Link
                href="/login"
                className="focus-ring text-ink-muted hover:text-ink hidden font-mono text-xs tracking-wider uppercase transition-colors lg:inline-flex"
              >
                Masuk
              </Link>
              <Link
                href="/start"
                className={cn(
                  "pressable focus-ring bg-iris text-canvas hover:bg-iris-deep items-center gap-2 rounded-full px-5 py-2 font-mono text-xs font-bold tracking-wider uppercase shadow-[0_4px_14px_rgb(157_66_35_/_0.28)]",
                  isLanding ? "hidden sm:inline-flex" : "inline-flex",
                )}
              >
                <span>Mulai</span>
                <ArrowUpRightIcon />
              </Link>
            </>
          )}

          {family !== "public" && family !== "auth" && family !== "assessment" && (
            <Link
              href="/"
              className="focus-ring border-line bg-surface text-ink hover:bg-surface-raised ui-transition inline-flex items-center gap-1 rounded-full border px-3.5 py-1 font-mono text-xs"
            >
              Beranda
            </Link>
          )}

          {/* Mobile Details Menu */}
          {items.length > 0 && (
            <details className="relative lg:hidden">
              <summary className="focus-ring border-line bg-surface text-ink hover:bg-surface-raised ui-transition flex h-11 min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-full border px-4 font-mono text-xs font-semibold tracking-wider uppercase [&::-webkit-details-marker]:hidden">
                Menu
              </summary>
              <nav
                aria-label="Menu navigasi"
                className="nav-menu-panel border-line bg-surface text-ink absolute top-[calc(100%+0.5rem)] right-0 z-50 flex min-w-56 flex-col gap-1.5 rounded-[18px] border p-4 font-mono text-xs uppercase shadow-[0_12px_32px_rgb(27_28_26_/_0.14)]"
              >
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="focus-ring text-ink-muted hover:bg-surface-raised hover:text-ink rounded-lg px-3 py-2 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                {family === "public" && (
                  <>
                    <div className="border-line my-1 border-t" />
                    <Link
                      href="/dashboard"
                      className="focus-ring text-ink-muted hover:bg-surface-raised hover:text-ink rounded-lg px-3 py-2 transition-colors"
                    >
                      Ruang pribadi
                    </Link>
                    <Link
                      href="/login"
                      className="focus-ring text-ink-muted hover:bg-surface-raised hover:text-ink rounded-lg px-3 py-2 transition-colors"
                    >
                      Masuk
                    </Link>
                  </>
                )}
              </nav>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}

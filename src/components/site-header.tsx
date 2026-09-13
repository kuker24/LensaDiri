"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/cn";
import type { RouteFamily } from "@/lib/route-family";

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

  const isLanding = pathname === "/";

  return (
    <header
      className={cn(
        // Name the properties. `transition-all` also animates layout
        // properties, which is a reflow per frame for no visual gain.
        "z-40 w-full transition-[background-color,border-color] duration-200 ease-out",
        "text-ink",
        isLanding ? "fixed inset-x-0 top-0 border-b-0 bg-transparent" : "nav-frost sticky top-0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand lockup */}
        <Link
          href="/"
          className="focus-ring group flex min-h-11 items-center gap-2.5 rounded-sm py-1 transition-opacity hover:opacity-80"
        >
          <BrandMark className="h-7 w-7 shrink-0" idPrefix="brand-header" />
          <span className="font-display text-base tracking-[0.18em] uppercase">LENSADIRI</span>
        </Link>

        {/*
          Chrome is deliberately bare: one way in. The information pages are
          still reachable from the footer, so the header carries no nav rail and
          no account entry point.
        */}
        <div className="flex items-center gap-3">
          {/*
            The landing page is exempt: the hero already paints a full-size
            MULAI control on the stage, so a second one in the chrome was the
            same action twice in one viewport.
          */}
          {family === "public" && !isLanding && (
            <Link
              href="/start"
              className="pressable focus-ring bg-iris text-canvas hover:bg-iris-deep inline-flex items-center gap-2 rounded-full px-5 py-2 font-mono text-xs font-bold tracking-wider uppercase shadow-[0_4px_14px_rgb(157_66_35_/_0.28)]"
            >
              <span>Mulai</span>
              <ArrowUpRightIcon />
            </Link>
          )}

          {family !== "public" && family !== "assessment" && (
            <Link
              href="/"
              className="focus-ring border-line bg-surface text-ink hover:bg-surface-raised ui-transition inline-flex min-h-11 items-center gap-1 rounded-full border px-3.5 py-1 font-mono text-xs"
            >
              Beranda
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

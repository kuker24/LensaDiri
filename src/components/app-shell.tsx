"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRouteFamily } from "@/lib/route-family";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const family = getRouteFamily(pathname);
  const isLanding = pathname === "/";
  const isCollectibleEntry = pathname === "/start";

  return (
    <>
      {isCollectibleEntry ? null : <SiteHeader family={family} />}
      <main id="konten-utama" className={isLanding ? "journey-home" : undefined}>
        {children}
      </main>
      {family === "public" && !isLanding && !isCollectibleEntry ? <SiteFooter /> : null}
    </>
  );
}

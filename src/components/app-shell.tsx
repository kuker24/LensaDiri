"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getRouteFamily } from "@/lib/route-family";

export function AppShell({ children }: { children: ReactNode }) {
  const family = getRouteFamily(usePathname());

  return (
    <>
      <SiteHeader family={family} />
      <main id="konten-utama">{children}</main>
      {family === "public" ? <SiteFooter /> : null}
    </>
  );
}

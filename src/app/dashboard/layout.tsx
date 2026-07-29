import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { follow: false, index: false },
};

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}

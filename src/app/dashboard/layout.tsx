import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { follow: false, index: false },
};

export default async function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  return <>{children}</>;
}

import { redirect } from "next/navigation";

import { requireAdminSession } from "@/server/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminSession();
  if (!admin) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

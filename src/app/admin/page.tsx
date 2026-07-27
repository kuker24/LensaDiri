import { redirect } from "next/navigation";
import Link from "next/link";

import { createAuditLog } from "@/server/repositories/audit-logs";
import { requireAdminSession } from "@/server/services/admin";

export default async function AdminIndexPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  await createAuditLog({
    action: "admin_accessed",
    actorAccountId: admin.accountId,
    entityId: null,
    entityType: "admin_resource",
    metadata: { source: "admin_index" },
  });

  const links = [
    { href: "/admin/modules", label: "Modul", desc: "Katalog modul" },
    {
      href: "/admin/module-versions",
      label: "Versi Modul",
      desc: "Versi, scoring, item bank",
    },
    { href: "/admin/questions", label: "Pertanyaan", desc: "Jumlah item per versi" },
    {
      href: "/admin/blueprints",
      label: "Blueprint",
      desc: "Inventori blueprint sesi",
    },
    { href: "/admin/combo-presets", label: "Combo Presets", desc: "Preset kombinasi" },
    {
      href: "/admin/scoring-versions",
      label: "Scoring Versions",
      desc: "Registry engine",
    },
    { href: "/admin/content", label: "Konten", desc: "Feature flags; CMS belum ada" },
    { href: "/admin/feedback", label: "Feedback", desc: "Rating + preview" },
    { href: "/admin/audit-logs", label: "Audit Logs", desc: "Log ter-redaksi" },
  ];

  return (
    <div className="task-shell">
      <p className="mono-label text-ink">Admin · read-only</p>
      <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em]">Panel Admin</h1>
      <p className="text-ink-muted mt-2 mb-2 leading-7">
        Role: <span className="text-ink font-medium">{admin.role}</span>. Mutasi off.
      </p>
      <p className="text-ink-muted mb-8 text-sm leading-6">
        Data dari database / scoring registry. Tanpa hardcode status.
      </p>

      <div className="grid gap-px overflow-hidden rounded-[20px] border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            className="row-hover bg-surface hover:bg-surface-raised p-5 transition-colors duration-200"
            href={link.href}
            key={link.href}
          >
            <h2 className="font-normal">{link.label}</h2>
            <p className="text-ink-muted mt-1 text-sm">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

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
    { href: "/admin/modules", label: "Modul", desc: "Katalog modul (DB)" },
    {
      href: "/admin/module-versions",
      label: "Versi Modul",
      desc: "Versi, scoring, item bank (DB)",
    },
    { href: "/admin/questions", label: "Pertanyaan", desc: "Jumlah item per versi (DB)" },
    {
      href: "/admin/blueprints",
      label: "Blueprint",
      desc: "Inventori blueprint sesi per mode (DB)",
    },
    { href: "/admin/combo-presets", label: "Combo Presets", desc: "Preset kombinasi (DB)" },
    {
      href: "/admin/scoring-versions",
      label: "Scoring Versions",
      desc: "Registry engine di kode",
    },
    { href: "/admin/content", label: "Konten", desc: "Feature flags (DB); CMS belum ada" },
    { href: "/admin/feedback", label: "Feedback", desc: "Rating + preview pesan (DB)" },
    { href: "/admin/audit-logs", label: "Audit Logs", desc: "Log operasional ter-redaksi" },
  ];

  return (
    <main className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold">Panel Admin</h1>
      <p className="text-ink-muted mt-2 mb-2 leading-7">
        Read-only. Role: <span className="text-ink font-medium">{admin.role}</span>. Mutasi
        dinonaktifkan.
      </p>
      <p className="text-ink-muted mb-8 text-sm leading-6">
        Data diambil dari database / scoring registry. Tidak ada status hardcode.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            className="border-line rounded-lg border bg-white/90 p-5 transition hover:shadow"
            href={link.href}
            key={link.href}
          >
            <h2 className="font-semibold">{link.label}</h2>
            <p className="text-ink-muted mt-1 text-sm">{link.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

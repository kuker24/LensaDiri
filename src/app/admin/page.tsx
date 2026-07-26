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
      <p className="mono-label text-aperture">Admin · read-only</p>
      <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em]">Panel Admin</h1>
      <p className="text-steel mt-2 mb-2 leading-7">
        Read-only. Role: <span className="text-ink font-medium">{admin.role}</span>. Mutasi
        dinonaktifkan.
      </p>
      <p className="text-steel mb-8 text-sm leading-6">
        Data diambil dari database / scoring registry. Tidak ada status hardcode.
      </p>

      <div className="grid gap-px overflow-hidden rounded-[1.2rem] border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            className="bg-surface hover:bg-surface-raised p-5 transition"
            href={link.href}
            key={link.href}
          >
            <h2 className="font-normal">{link.label}</h2>
            <p className="text-steel mt-1 text-sm">{link.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

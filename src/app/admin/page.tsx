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
      desc: "Versi, penilaian, bank pertanyaan",
    },
    { href: "/admin/questions", label: "Pertanyaan", desc: "Jumlah item per versi" },
    {
      href: "/admin/blueprints",
      label: "Blueprint",
      desc: "Inventori blueprint sesi",
    },
    { href: "/admin/combo-presets", label: "Preset Kombinasi", desc: "Kombinasi terkurasi" },
    {
      href: "/admin/scoring-versions",
      label: "Versi Penilaian",
      desc: "Daftar mesin penilaian",
    },
    { href: "/admin/content", label: "Konten", desc: "Status fitur; CMS belum ada" },
    { href: "/admin/feedback", label: "Umpan Balik", desc: "Penilaian dan pratinjau" },
    { href: "/admin/audit-logs", label: "Log Audit", desc: "Log teredaksi" },
  ];

  return (
    <div className="task-shell">
      <p className="mono-label text-ink">Admin · hanya-baca</p>
      <h1 className="mt-3 text-3xl font-normal tracking-[-0.03em]">Panel Admin</h1>
      <p className="text-ink-muted mt-2 mb-2 leading-7">
        Peran: <span className="text-ink font-medium">{admin.role}</span>. Perubahan dinonaktifkan.
      </p>
      <p className="text-ink-muted mb-8 text-sm leading-6">
        Data dari basis data dan daftar penilaian. Status dibaca dari sumbernya.
      </p>

      <div className="grid gap-px overflow-hidden rounded-[20px] border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            className="row-hover bg-surface hover:bg-surface-raised p-5"
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

import { redirect } from "next/navigation";
import Link from "next/link";

import { requireAdminSession } from "@/server/services/admin";

export default async function AdminIndexPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/dashboard");

  const links = [
    { href: "/admin/modules", label: "Modul", desc: "Kelola modul assessment" },
    {
      href: "/admin/module-versions",
      label: "Versi Modul",
      desc: "Kelola versi dan status publikasi",
    },
    { href: "/admin/questions", label: "Pertanyaan", desc: "Bank item dan mapping dimensi" },
    { href: "/admin/blueprints", label: "Blueprint", desc: "Template sesi assessment" },
    { href: "/admin/combo-presets", label: "Combo Presets", desc: "Paket kombinasi modul" },
    { href: "/admin/scoring-versions", label: "Scoring Versions", desc: "Versi algoritma scoring" },
    { href: "/admin/content", label: "Konten", desc: "Kelola teks dan informasi" },
    { href: "/admin/feedback", label: "Feedback", desc: "Ulasan pengguna" },
    { href: "/admin/audit-logs", label: "Audit Logs", desc: "Log akses dan perubahan" },
  ];

  return (
    <main className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold">Panel Admin</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Selamat datang di panel administrasi. Pilih kategori di bawah ini.
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

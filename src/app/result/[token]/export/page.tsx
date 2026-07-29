import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getPrivateResultByToken } from "@/server/services/assessment";
import { getButtonClassName } from "@/components/ui/button";

export default async function ResultExportPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { token } = await params;

  const result = await getPrivateResultByToken(token);
  if (!result) {
    return notFound();
  }

  const encoded = encodeURIComponent(token);

  return (
    <div className="task-shell">
      <nav
        aria-label="Jejak navigasi"
        className="text-ink-muted mb-6 font-mono text-xs tracking-[-0.02em]"
      >
        <Link
          className="focus-ring quiet-link rounded-[12px]"
          href="/dashboard/results"
          prefetch={false}
        >
          Hasil
        </Link>
        <span className="mx-2">/</span>
        <Link className="focus-ring quiet-link rounded-[12px]" href={`/result/${token}`}>
          Hasil #{token.slice(0, 8)}
        </Link>
        <span className="mx-2">/</span>
        <span>Ekspor</span>
      </nav>

      <h1 className="text-3xl font-normal tracking-[-0.03em]">Ekspor data</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Unduh salinan hasil privatmu. Laporan PDF menata ringkasan skor dan refleksi dalam format
        Soft Product LensaDiri untuk semua lensa, combo, dan mix.
      </p>

      <div className="border-line bg-surface rounded-[16px] border p-6">
        <h2 className="text-lg font-normal">Laporan PDF</h2>
        <p className="text-ink-muted mt-3 text-sm leading-6">
          Laporan profesional untuk dibaca dan disimpan — mencakup ringkasan, skor lensa, dan
          refleksi.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className={getButtonClassName("primary", "md")}
            download
            href={`/api/result/export/${encoded}`}
          >
            Unduh laporan (PDF)
          </a>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link className={getButtonClassName("secondary", "md")} href={`/result/${token}`}>
          Kembali
        </Link>
      </div>
    </div>
  );
}

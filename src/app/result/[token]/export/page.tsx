import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getResultByHash } from "@/server/repositories/assessment";
import { Button } from "@/components/ui/button";

export default async function ResultExportPage({ params }: { params: Promise<{ token: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { token } = await params;

  const result = await getResultByHash(token);
  if (!result) {
    return notFound();
  }

  return (
    <main className="container-shell py-12">
      <nav aria-label="Breadcrumb" className="text-ink-muted mb-6 text-sm">
        <Link className="hover:text-ink underline" href="/dashboard/results">
          Hasil
        </Link>
        <span className="mx-2">/</span>
        <Link className="hover:text-ink underline" href={`/result/${token}`}>
          Hasil #{token.slice(0, 8)}
        </Link>
        <span className="mx-2">/</span>
        <span>Ekspor</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold">Ekspor Data</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Unduh salinan hasil privatmu dalam format JSON terstruktur untuk referensi pribadi. File ini
        mencakup ringkasan skor, penjaminan privasi, dan batasan interpretasi.
      </p>

      <div className="border-line rounded-lg border bg-white/90 p-6">
        <h2 className="text-lg font-semibold">Format Ekspor</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <strong>JSON:</strong>{" "}
            <span className="text-ink-muted">Data lengkap terstruktur untuk pribadi.</span>
          </li>
          <li>
            <strong>Teks:</strong>{" "}
            <span className="text-ink-muted">Ringkasan naratif untuk dibaca.</span>
          </li>
        </ul>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href={`/result/${token}`}>
          <Button variant="secondary">Kembali</Button>
        </Link>
      </div>
    </main>
  );
}

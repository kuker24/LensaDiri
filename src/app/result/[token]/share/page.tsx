import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getPrivateResultByToken } from "@/server/services/assessment";
import { getButtonClassName } from "@/components/ui/button";

export default async function ResultSharePage({ params }: { params: Promise<{ token: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { token } = await params;

  const result = await getPrivateResultByToken(token);
  if (!result) {
    return notFound();
  }

  return (
    <div className="task-shell">
      <nav
        aria-label="Jejak navigasi"
        className="text-ink-muted mb-6 font-mono text-xs tracking-[-0.02em]"
      >
        <Link className="focus-ring quiet-link rounded-[12px]" href="/dashboard/results">
          Hasil
        </Link>
        <span className="mx-2">/</span>
        <Link className="focus-ring quiet-link rounded-[12px]" href={`/result/${token}`}>
          Hasil #{token.slice(0, 8)}
        </Link>
        <span className="mx-2">/</span>
        <span>Bagikan</span>
      </nav>

      <h1 className="text-3xl font-normal tracking-[-0.03em]">Kontrol berbagi</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Hasilmu bersifat privat secara default. Kamu bisa membuat link share yang bisa dicabut
        sewaktu-waktu.
      </p>

      <div className="border-line bg-surface rounded-[16px] border p-6">
        <p className="text-lg font-normal">
          Hasil dengan token: {token.slice(0, 8)}... (detail share lihat di dashboard)
        </p>
        <p className="text-ink-muted mt-2 text-sm">
          Fitur share token management tersedia di endpoint API. Dashboard akan menampilkan
          ringkasan share token.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link className={getButtonClassName("secondary", "md")} href={`/result/${token}`}>
          Kembali
        </Link>
      </div>
    </div>
  );
}

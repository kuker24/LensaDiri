import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getPrivateResultByToken } from "@/server/services/assessment";
import { Button } from "@/components/ui/button";

export default async function ResultSharePage({ params }: { params: Promise<{ token: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  const { token } = await params;

  const result = await getPrivateResultByToken(token);
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
        <span>Bagikan</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold">Kontrol Share</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Hasilmu bersifat private secara default. Kamu bisa membuat link share yang bisa dicabut
        sewaktu-waktu.
      </p>

      <div className="border-line rounded-lg border bg-white/90 p-6">
        <p className="text-lg font-medium">
          Hasil dengan token: {token.slice(0, 8)}... (detail share lihat di dashboard)
        </p>
        <p className="text-ink-muted mt-2 text-sm">
          Fitur share token management tersedia di endpoint API. Dashboard akan menampilkan
          ringkasan share token.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href={`/result/${token}`}>
          <Button variant="secondary">Kembali</Button>
        </Link>
      </div>
    </main>
  );
}

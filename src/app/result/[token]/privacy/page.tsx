import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getPrivateResultByToken } from "@/server/services/assessment";
import { Button } from "@/components/ui/button";

export default async function ResultPrivacyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
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
        <span>Privasi</span>
      </nav>

      <h1 className="font-display text-3xl font-semibold">Pengaturan Privasi</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Hasil asesmenmu adalah data pribadi. Kamu yang memutuskan siapa yang bisa melihat.
      </p>

      <div className="border-line rounded-lg border bg-white/90 p-6">
        <h2 className="text-lg font-semibold">Status data</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <strong>Token akses:</strong>{" "}
            <span className="text-ink-muted">
              Token hasil disimpan sebagai hash dan tidak disimpan dalam bentuk mentah.
            </span>
          </li>
          <li>
            <strong>Akses privat:</strong>{" "}
            <span className="text-ink-muted">
              Hasil hanya dapat dibuka melalui token privat atau link berbagi yang kamu buat secara
              eksplisit.
            </span>
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

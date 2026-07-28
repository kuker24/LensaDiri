import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/server/current-session";
import { getPrivateResultByToken } from "@/server/services/assessment";
import { getButtonClassName } from "@/components/ui/button";

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
    <div className="task-shell">
      <nav
        aria-label="Jejak navigasi"
        className="text-ink-muted mb-6 font-mono text-xs tracking-[-0.02em]"
      >
        <Link className="focus-ring quiet-link rounded-[12px]" href="/dashboard/results">
          Hasil
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <Link className="focus-ring quiet-link rounded-[12px]" href={`/result/${token}`}>
          Hasil #{token.slice(0, 8)}
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>Privasi</span>
      </nav>

      <h1 className="text-3xl font-normal tracking-[-0.03em]">Pengaturan privasi</h1>
      <p className="text-ink-muted mt-2 mb-8 leading-7">
        Hasil asesmenmu adalah data pribadi. Kamu yang memutuskan siapa yang bisa melihat.
      </p>

      <div className="border-line bg-surface rounded-[16px] border p-6">
        <h2 className="text-lg font-normal">Status data</h2>
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
              Hasil hanya dapat dibuka melalui token privat atau tautan berbagi yang kamu buat
              secara eksplisit.
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-8 flex gap-4">
        <Link className={getButtonClassName("secondary", "md")} href={`/result/${token}`}>
          Kembali
        </Link>
      </div>
    </div>
  );
}

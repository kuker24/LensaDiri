import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PausePage() {
  return (
    <main className="container-shell py-12 text-center">
      <h1 className="font-display text-3xl font-semibold">Sesi Dihentikan</h1>
      <p className="text-ink-muted mt-4 leading-7">
        Prosesmu telah disimpan secara otomatis. Kamu dapat melanjutkan kapan saja.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/dashboard/sessions">
          <Button variant="secondary">Dashboard Sesi</Button>
        </Link>
        <Link href="/dashboard">
          <Button>Kembali ke Dashboard</Button>
        </Link>
      </div>
    </main>
  );
}

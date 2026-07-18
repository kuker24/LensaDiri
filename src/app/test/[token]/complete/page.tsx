import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CompletePage() {
  return (
    <main className="container-shell py-12 text-center">
      <h1 className="font-display text-3xl font-semibold">Sesi Lengkap</h1>
      <p className="text-ink-muted mt-4 mb-8 leading-7">
        Kamu telah menyelesaikan semua pertanyaan. Hasilmu sedang diproses.
      </p>
      <Link href="/dashboard/results">
        <Button>Lihat Hasil</Button>
      </Link>
    </main>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ClarifierPage() {
  return (
    <main className="container-shell py-12 text-center">
      <h1 className="font-display text-3xl font-semibold">Klarifikasi</h1>
      <p className="text-ink-muted mt-4 leading-7">
        Beberapa pertanyaan tambahan untuk membantu interpretasi hasil yang lebih baik.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/dashboard/sessions">
          <Button>Lanjutkan Klarifikasi</Button>
        </Link>
      </div>
    </main>
  );
}

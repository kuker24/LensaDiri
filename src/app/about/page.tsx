import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="container-shell py-12 sm:py-18">
      <article className="max-w-4xl">
        <p className="text-sm font-semibold text-lens">Tentang LensaDiri</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Refleksi berlapis tanpa label mutlak
        </h1>
        <p className="mt-6 leading-8 text-ink-muted">
          LensaDiri membantu pengguna membaca pola jawaban melalui beberapa modul independen. Skor
          primer dihitung secara deterministic di server, lalu hubungan antar-lensa dijelaskan tanpa
          mengubah skor tersebut.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <section className="rounded-md border border-line bg-white p-6 shadow-surface">
            <h2 className="font-display text-xl font-semibold text-ink">Yang kami lakukan</h2>
            <p className="mt-3 leading-7 text-ink-muted">
              Menyediakan assessment reflektif, confidence, quality notice, clarifier, dan kontrol
              data private.
            </p>
          </section>
          <section className="rounded-md border border-line bg-white p-6 shadow-surface">
            <h2 className="font-display text-xl font-semibold text-ink">Yang tidak kami klaim</h2>
            <p className="mt-3 leading-7 text-ink-muted">
              LensaDiri bukan diagnosis, bukan pengganti profesional, dan belum mengklaim validasi
              psikometrik formal.
            </p>
          </section>
        </div>
        <Link href="/modules">
          <Button className="mt-8">
            Lihat katalog modul
          </Button>
        </Link>
      </article>
    </main>
  );
}

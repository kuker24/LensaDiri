import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="container-shell py-12 sm:py-18">
      <article className="max-w-4xl">
        <h1 className="mt-2 tracking-[-0.035em]">
          <span className="text-lens mb-2 block text-sm font-semibold tracking-wider uppercase">
            Tentang LensaDiri
          </span>
          <span className="text-ink block text-4xl font-semibold sm:text-5xl">
            Refleksi berlapis tanpa label mutlak
          </span>
        </h1>
        <p className="text-ink-muted mt-6 leading-8">
          LensaDiri membantu pengguna membaca pola jawaban melalui beberapa modul independen. Skor
          primer dihitung secara deterministic di server, lalu hubungan antar-lensa dijelaskan tanpa
          mengubah skor tersebut.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <section className="border-line rounded-md border bg-white/90 p-6">
            <h2 className="text-ink text-xl font-semibold">Yang kami lakukan</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Menyediakan assessment reflektif, confidence, quality notice, clarifier, dan kontrol
              data private.
            </p>
          </section>
          <section className="border-line rounded-md border bg-white/90 p-6">
            <h2 className="text-ink text-xl font-semibold">Yang tidak kami klaim</h2>
            <p className="text-ink-muted mt-3 leading-7">
              LensaDiri bukan diagnosis, bukan pengganti profesional, dan belum mengklaim validasi
              psikometrik formal.
            </p>
          </section>
        </div>
        <Link href="/modules" className={getButtonClassName("primary", "md") + " mt-8"}>
          Lihat katalog modul
        </Link>
      </article>
    </main>
  );
}
